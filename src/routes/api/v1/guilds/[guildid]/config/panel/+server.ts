import { JsonErrors } from "$lib/constants.js";
import { FlattenDateFields, FlattenDocToJSON, Panel } from "$lib/server/db";
import { json } from "@sveltejs/kit";

export async function GET({ params }) {
  const panel = await Panel.findOne({ guildId: params.guildid });

  if (!panel) {
    return JsonErrors.notFound("Panel configuration not found");
  }

  return json(FlattenDateFields(FlattenDocToJSON(panel), "createdAt", "updatedAt"));
}

