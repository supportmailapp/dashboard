import { DBTag, FlattenDocToJSON } from "$lib/server/db";
import type { FilterQuery } from "mongoose";
import type { ITag } from "supportmail-types";

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
    snippets: snippets.map((s) => FlattenDocToJSON(s, true)),
  };
}
