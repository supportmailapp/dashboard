import { DBTag, FlattenDateFields, FlattenDocToJSON } from "$lib/server/db";
import type { ITag } from "$lib/sm-types/src";
import { json } from "@sveltejs/kit";
import { GetTagSchemaForGuild } from "$v1Api/assertions.js";
import z from "zod";
import { ZodValidator } from "$lib/server/validators/index.js";
import { JsonErrors } from "$lib/constants.js";

export type TagsResponse = APITag[];

export type APITag = 
  Omit<ITag, "createdAt" | "updatedAt"> & {
    /** Always returned by the API */
    createdAt?: string;
    updatedAt?: string;
    _id?: string;
    local?: true;
    delete?: true;
  };

export async function GET({ params, url }) {
  const tags = await DBTag.find({
    guildId: params.guildid,
  });

  return json(
    tags
      .map((tag) => FlattenDocToJSON(tag, true))
      .map((tag) => FlattenDateFields(tag, "createdAt", "updatedAt")),
  );
}

export async function PUT({ request, params }) {
  let body: APITag[];
  try {
    const reqJson = await request.json();
    const valSchema = GetTagSchemaForGuild(params.guildid);
    const valRes = new ZodValidator(valSchema).validate(reqJson);
    if (!valRes.success) {
      return JsonErrors.badRequest(valRes.error.message);
    }
    body = valRes.data;
  } catch {
    return JsonErrors.badRequest("Invalid JSON body");
  }

  const tagsToCreate = body.filter((tag) => tag.local);
  const tagsToUpdate = body.filter((tag) => !tag.local && !tag.delete);
  const tagsToDelete = body.filter((tag) => tag.delete).filter((tag) => !tag.local);

  await DBTag.deleteMany({
    _id: { $in: tagsToDelete.map((tag) => tag._id!) },
    guildId: params.guildid,
  });

  const updatedTags = await Promise.all(
    tagsToUpdate.map((tag) =>
      DBTag.findByIdAndUpdate(
        tag._id!,
        {
          name: tag.name,
          content: tag.content,
          onlyTickets: tag.onlyTickets,
        },
        { new: true },
      ),
    ),
  );

  const createdTags = await DBTag.insertMany(
    tagsToCreate.map((tag) => ({
      guildId: tag.guildId,
      name: tag.name,
      content: tag.content,
      onlyTickets: tag.onlyTickets,
    })),
  );

  const toDelete = tagsToDelete.map((tag) => tag._id!);

  const allTags = [...updatedTags.filter((tag) => !!tag), ...createdTags]
    .map((tag) => FlattenDocToJSON(tag!))
    .map((tag) => FlattenDateFields(tag, "createdAt", "updatedAt"));

  return json(allTags);
}
