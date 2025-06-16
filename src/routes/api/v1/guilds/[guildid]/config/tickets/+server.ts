import { JsonErrors } from "$lib/constants.js";
import { getDBGuild } from "$lib/server/db/utils.js";

export async function GET({ locals: { guildId } }) {
  if (!guildId) {
    return JsonErrors.badRequest();
  }

  try {
    const config = await getDBGuild(guildId, "generalTicketSettings");
    if (!config) {
      return JsonErrors.notFound();
    }

    return Response.json(config);
  } catch (err: any) {
    console.error("Error fetching guild ticket config:", err);
    return JsonErrors.serverError();
  }
}
