import { FlattenDocToJSON, TicketCategory } from "$lib/server/db/index.js";

export async function load({ parent, params, locals }) {
  await parent();

  const category = await TicketCategory.findOne({ guildId: locals.guildId!, _id: params.categoryid });

  return {
    category: category ? FlattenDocToJSON(category, true) : null,
  };
}
