import { FlattenDocToJSON, TicketCategory } from "$lib/server/db/index.js";

export async function load({ parent, params, locals, depends }) {
  depends("ticket-categories/" + params.categoryid);
  await parent();

  const category = await TicketCategory.findOne({ guildId: locals.guildId!, _id: params.categoryid });

  return {
    category: category ? FlattenDocToJSON(category, true) : null,
  };
}
