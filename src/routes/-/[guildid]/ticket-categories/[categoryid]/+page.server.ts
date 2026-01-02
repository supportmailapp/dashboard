import { FlattenDocToJSON, TicketCategory } from "$lib/server/db/index.js";

export async function load({ parent, params, depends }) {
  depends("ticket-categories/" + params.categoryid);
  await parent();

  const category = await TicketCategory.findOne({ guildId: params.guildid, _id: params.categoryid });

  return {
    category: category ? FlattenDocToJSON(category, true) : null,
  };
}
