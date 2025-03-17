import { overwriteUserGuilds, parseToCacheGuild, setGuilds } from "$lib/cache/guilds";
import { getToken } from "$lib/cache/users";
import { fetchUserGuilds } from "$lib/discord/oauth2";
import clientAPI from "$lib/server/clientApi";
import { canManageBot } from "$lib/utils/permissions";
import { error, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ fetch, params, url }) => {
  const userId = params.userid as string;
  const aToken = getToken(userId);
  if (!aToken) return error(400, { message: "Invalid user" });

  let guilds = await fetchUserGuilds(userId, aToken, {
    bypassCache: url.searchParams.get("bypass_cache") === "true",
  });

  const validBotGuildIds = await clientAPI.filterMutualGuilds(guilds.map((guild) => guild.id));

  let modifedGuilds = guilds.map((g) => parseToCacheGuild(g, validBotGuildIds.includes(g.id)));

  setGuilds(...modifedGuilds);
  overwriteUserGuilds(
    userId,
    modifedGuilds.map((g) => g.id),
  );

  if (url.searchParams.get("manage_bot_only") === "true") {
    const filteredGuilds = modifedGuilds.filter((guild) => canManageBot(BigInt(guild.permissions)));
    return Response.json(filteredGuilds, { status: 200, statusText: "OK" });
  }

  return Response.json(modifedGuilds, { status: 200, statusText: "OK" });
};
