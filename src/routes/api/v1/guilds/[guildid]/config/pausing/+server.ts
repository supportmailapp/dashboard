import { JsonErrors } from "$lib/constants";
import { getDBGuild } from "$lib/server/db/utils.js";

export async function GET({ locals }) {
  const pausing = await getDBGuild(locals.guildId!, "pausing");

  if (!pausing) {
    return JsonErrors.notFound();
  }

  return Response.json(pausing);
}
