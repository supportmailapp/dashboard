import { getTicketCategories } from "$lib/server/db";

export async function GET({ locals: { guildId } }) {
  const cats = await getTicketCategories(guildId);
  return Response.json([]);
}
