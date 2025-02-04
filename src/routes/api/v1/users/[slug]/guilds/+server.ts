import { env } from "$env/dynamic/private";
import { overwriteUserGuilds, setGuilds } from "$lib/cache/guilds";
import { getToken } from "$lib/cache/users";
import { fetchUserGuilds } from "$lib/discord/oauth2";
import clientAPI from "$lib/server/clientApi";
import { canManageBot } from "$lib/utils/permissions";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ fetch, params, url }) => {
  const userId = params.slug as string;
  const aToken = getToken(userId);
  if (!aToken) return error(400, { message: "Invalid user" });

  let guilds = await fetchUserGuilds(userId, aToken, fetch, {
    bypassCache: url.searchParams.get("bypass_cache") === "true",
  });

  const validBotGuildIds = await clientAPI.filterMutualGuilds(
    guilds.map((guild) => guild.id),
    aToken,
  );

  let modifedGuilds: DCGuild[] = guilds.map((guild) => ({
    ...guild,
    isConfigured: validBotGuildIds.includes(guild.id),
  }));

  setGuilds(...modifedGuilds);
  overwriteUserGuilds(
    userId,
    modifedGuilds.map((g) => g.id),
  );

  if (url.searchParams.get("manage_bot_only") === "true") {
    Response.json(
      modifedGuilds.filter((guild) => canManageBot(Number(guild.permissions))),
      { status: 200, statusText: "OK" },
    );
  }

  return Response.json(modifedGuilds, { status: 200, statusText: "OK" });
};
