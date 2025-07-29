import { FlattenDocToJSON, TicketCategory } from "$lib/server/db/index.js";

export async function load({ depends, locals }) {
  depends("ticket-categories");
  const categories = await TicketCategory.find({ guildId: locals.guildId! }, null, { sort: { index: 1 } });

  return {
    categories: categories.map((doc) => FlattenDocToJSON(doc, true)),
    categoryCount: categories.length,
  };
}
