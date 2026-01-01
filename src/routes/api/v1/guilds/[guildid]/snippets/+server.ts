import { JsonErrors } from "$lib/constants.js";
import { DBTag, FlattenDocToJSON } from "$lib/server/db";
import { ZodValidator } from "$lib/server/validators/index.js";
import type { ITag } from "$lib/sm-types";
import { safeParseInt, sanitizeSnippetName } from "$lib/utils.js";
import type { QueryFilter } from "mongoose";
import z from "zod";

export type PaginatedResponseWithError<T> = PaginatedResponse<T> & {
  error: string;
};

export type APISnippet = DocumentWithId<
  Pick<ITag, "name" | "content" | "guildId" | "onlyTickets"> & {
    createdAt: string;
    updatedAt: string;
  }
>;

export type PaginatedSnippetsResponse = PaginatedResponse<APISnippet>;

export async function GET({ locals, url, params }) {
  const Params = {
    search: url.searchParams.get("search") ?? undefined,
    page: safeParseInt(url.searchParams.get("page"), 1, 1, 9999),
    pageSize: safeParseInt(url.searchParams.get("limit"), 25, 1, 100),
    offset: function () {
      return (this.page - 1) * this.pageSize;
    },
  };
  const QueryFilter: QueryFilter<ITag> = { guildId: params.guildid };

  if (Params.search) {
    QueryFilter.name = { $regex: Params.search, $options: "i" };
  }

  try {
    const snippets = await DBTag.find(QueryFilter, null, {
      limit: Params.pageSize,
      skip: Params.offset(),
      sort: { createdAt: -1 },
    });

    const totalSnippets = await DBTag.countDocuments(QueryFilter);

    const response: PaginatedSnippetsResponse = {
      data: snippets.map((d) => FlattenDocToJSON(d, true)) as any[], // mongoose types...
      pagination: {
        page: Params.page,
        pageSize: Params.pageSize,
        totalItems: totalSnippets,
        totalPages: Math.ceil(totalSnippets / Params.pageSize),
      },
    };

    return Response.json(response);
  } catch (error) {
    const response: PaginatedSnippetsResponse = {
      data: [],
      pagination: {
        page: 1,
        pageSize: 25,
        totalItems: 0,
        totalPages: 0,
      },
      error: "Failed to fetch snippets",
    };

    return Response.json(response, { status: 500 });
  }
}

const snippetSchema = z.object({
  _id: z.string().optional(),
  name: z
    .string()
    .min(3)
    .max(50)
    .transform((name) => sanitizeSnippetName(name).trim()),
  content: z.string().min(1).max(4000).trim(),
});

export async function PUT({ locals, request, params }) {
  try {
    const body = await request.json();
    const valRes = new ZodValidator(snippetSchema).validate(body);

    if (!valRes.success) {
      return JsonErrors.badRequest(ZodValidator.toHumanError(valRes.error));
    }

    let dbSnippet: any; // mongoose types are ass
    if (valRes.data._id) {
      dbSnippet = await DBTag.findOneAndUpdate(
        {
          _id: valRes.data._id,
          guildId: params.guildid,
        },
        {
          name: valRes.data.name,
          content: valRes.data.content,
        },
        {
          new: true,
          upsert: true,
        },
      );
    } else {
      dbSnippet = await DBTag.create({
        guildId: params.guildid,
        name: valRes.data.name,
        content: valRes.data.content,
      });
    }

    if (!dbSnippet) {
      return JsonErrors.notFound("Snippet not found");
    }

    return Response.json(FlattenDocToJSON(dbSnippet, true), { status: 201 });
  } catch (err: any) {
    return JsonErrors.serverError(err.message || "Failed to create snippet");
  }
}
