import { getUserGuilds } from "$lib/discord/oauth2";
import { decodeToken } from "$lib/server/auth";
import clientAPI from "$lib/server/clientApi";
import { canManageBot } from "$lib/utils/permissions";
import { error, json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ cookies, fetch, url }) => {
  const searchParams = url.searchParams;
  const token = decodeToken(cookies.get("discord-token"), true);
  if (!token) {
    return error(401, "Unauthorized");
  }

  let guilds = await getUserGuilds(token.userId, token.access_token, fetch, url.searchParams.get("bypass_cache") === "true");

  if (searchParams.get("manage_bot_only") === "true") {
    guilds = guilds.filter((guild) => guild.owner || canManageBot(Number(guild.permissions)));
  }

  const validBotGuildIds = await clientAPI.filterMutualGuilds(
    guilds.map((guild) => guild.id),
    token.userId,
  );

  const modifedGuilds = guilds.map((guild) => ({
    ...guild,
    isConfigured: validBotGuildIds.includes(guild.id),
  }));
  return json(modifedGuilds);
};
