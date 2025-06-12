import { JsonErrors } from "$lib/constants";
import { DiscordUserAPI } from "$lib/server/discord";
import { type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!(locals.user?.id && locals.token)) return JsonErrors.unauthorized();

  const rest = locals.discordUserRest || new DiscordUserAPI(locals.token.accessToken);

  let guilds = await rest.getCurrentUserGuilds(locals.user.id);

  return Response.json(guilds, { status: 200, statusText: "OK" });
};
