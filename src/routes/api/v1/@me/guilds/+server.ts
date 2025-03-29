import { ErrorResponses } from "$lib/constants";
import { fetchUserGuilds } from "$lib/discord/utils";
import { type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!(locals.userId && locals.token)) return ErrorResponses.unauthorized();

  let guilds = await fetchUserGuilds(locals.userId, locals.token, {
    bypassCache: url.searchParams.get("bypass_cache") === "true",
    only: {
      canManage: url.searchParams.get("manage_bot") === "true",
    },
  });

  return Response.json(guilds, { status: 200, statusText: "OK" });
};
