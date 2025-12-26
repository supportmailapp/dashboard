import { JsonErrors } from "$lib/constants";
import { BlacklistEntry, FlattenBigIntFields, FlattenDocToJSON } from "$lib/server/db";
import { SnowflakePredicate, ZodValidator } from "$lib/server/validators/index.js";
import { EntityType, type IBlacklistEntry } from "$lib/sm-types";
import { safeParseInt } from "$lib/utils.js";
import { BitField } from "$lib/utils/bitfields.js";
import type { FilterQuery } from "mongoose";
import z from "zod";

export type APIBlacklistEntry = DocumentWithId<Omit<IBlacklistEntry, "scopes" | "scope" | "_type">> & {
  /**
   * A string representation of the bitfield for the scopes.
   */
  scopes: string;
  _type: Exclude<EntityType, EntityType.guild>;
};

export type PaginatedBlacklistResponse = PaginatedResponse<APIBlacklistEntry>;

type AllowedEntityType = Exclude<EntityType, EntityType.guild> | -1;

export async function GET({ locals, url }) {
  if (!locals.guildId || !locals.isAuthenticated()) return JsonErrors.unauthorized();
  const guildId = locals.guildId;

  try {
    // Parse pagination parameters
    const Params = {
      page: safeParseInt(url.searchParams.get("page"), 1, 1),
      pageSize: safeParseInt(url.searchParams.get("pageSize"), 20, 10, 100),
      search: url.searchParams.has("search")
        ? decodeURIComponent(url.searchParams.get("search")!)
        : undefined,
      scopes: url.searchParams.get("scopes"),
      type: safeParseInt(url.searchParams.get("type"), -1, -1, 1) as AllowedEntityType, // The min and max have to be passed because safeParseInt defaults to min:0
      sorting: (url.searchParams.get("sorting") || "newest") as "newest" | "oldest",
    };

    console.log("Params:", Params);

    const skip = (Params.page - 1) * Params.pageSize;

    // Build filter query
    const filter: FilterQuery<IBlacklistEntry> = { guildId: guildId };

    if (Params.search) {
      filter.id = { $regex: Params.search, $options: "i" };
    }

    if (Params.type > -1) {
      filter._type = Params.type;
    }

    if (Params.scopes && /^\d+$/.test(Params.scopes)) {
      const scopeBitfield = new BitField(Params.scopes);
      filter.scopes = { $bitsAnySet: scopeBitfield.bits };
    }

    const sort = { updatedAt: Params.sorting === "oldest" ? 1 : -1 };

    const [entries, totalItems] = await Promise.all([
      BlacklistEntry.find(filter, null, {
        sort,
        skip: skip,
        limit: Params.pageSize,
      }),
      BlacklistEntry.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / Params.pageSize);

    const response: PaginatedBlacklistResponse = {
      data: entries.map((d) => FlattenDocToJSON(d, true)).map(FlattenBigIntFields) as APIBlacklistEntry[],
      pagination: {
        page: Params.page,
        pageSize: Params.pageSize,
        totalItems,
        totalPages,
      },
    };

    console.log("Response:", response);

    return Response.json(response);
  } catch (error) {
    console.error(error);
    const response: PaginatedBlacklistResponse = {
      data: [],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
      },
      error: "Failed to fetch entries",
    };

    return Response.json(response, { status: 500 });
  }
}

const entrySchema = z.object({
  id: SnowflakePredicate,
  guildId: SnowflakePredicate.optional(), // optional because we get this one from the route - the field itself is just for validation
  // scopes is a bitfield
  scopes: z.string().regex(/^\d+$/, {
    error: "Invalid bitfield format (must only be numbers)",
  }),
  _type: z.enum({
    role: EntityType.role,
    user: EntityType.user,
  }),
});

export async function PUT({ locals, request }) {
  if (!locals.isAuthenticated()) return JsonErrors.unauthorized();

  const body = await request.json();

  const valRes = new ZodValidator(entrySchema).validate(body);
  if (!valRes.success) {
    return JsonErrors.badRequest(ZodValidator.toHumanError(valRes.error));
  }

  const { data } = valRes;

  const scopes = new BitField(data.scopes);

  try {
    const entry = await BlacklistEntry.findOneAndUpdate(
      {
        id: data.id,
        guildId: locals.guildId!,
      },
      {
        id: data.id,
        guildId: locals.guildId!,
        _type: data._type,
        scopes: scopes.bits,
      },
      { upsert: true, new: true },
    );

    return Response.json(FlattenBigIntFields(FlattenDocToJSON(entry, true)), { status: 200 });
  } catch (error) {
    return JsonErrors.serverError("Failed to create or update blacklist entry");
  }
}

const deleteSchema = z.object({
  ids: z
    .string()
    .array()
    .min(1, { error: "At least one ID is required" })
    .transform((ids) => ids.map((id) => id.trim())),
});

export async function DELETE({ locals, request }) {
  if (!locals.isAuthenticated()) return JsonErrors.unauthorized();

  const guildId = locals.guildId!;

  const body = await request.json();
  const valRes = new ZodValidator(deleteSchema).validate(body);
  if (!valRes.success) {
    return JsonErrors.badRequest(ZodValidator.toHumanError(valRes.error));
  }

  const { data } = valRes;

  try {
    const result = await BlacklistEntry.deleteMany({
      _id: { $in: data.ids },
      guildId: guildId,
    });
    return Response.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    return JsonErrors.serverError("Failed to delete blacklist entries");
  }
}
