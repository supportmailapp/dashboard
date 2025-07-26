import { FlattenDocToJSON, TicketCategory } from "$lib/server/db/index.js";

export async function load({ parent, locals }) {
  const categories = await TicketCategory.find({ guildId: locals.guildId! });

  return {
    categories: categories.map((doc) => FlattenDocToJSON(doc, true)),
    categoryCount: categories.length,
  };
}
