import { DBTag, FlattenDocToJSON } from "$lib/server/db";
import type { ITag } from "$lib/sm-types";
import type { FilterQuery } from "mongoose";
import type { APISnippet } from "../../../api/v1/guilds/[guildid]/snippets/+server.js";

export async function load({ locals, url }) {
  const filterFields: FilterQuery<ITag> = {
    guildId: locals.guildId!,
  };
  if (url.searchParams.get("search")) {
    const searchTerm = url.searchParams.get("search")!;
    filterFields.name = { $regex: searchTerm, $options: "i" };
  }
  const snippets = await DBTag.find(filterFields);

  return {
    snippets: snippets.map((s) => FlattenDocToJSON(s, true)) as unknown as APISnippet[],
  };
}
