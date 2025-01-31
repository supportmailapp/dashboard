import { env } from "$env/dynamic/private";
import { urls } from "$lib/constants";
import { fetchUserGuilds } from "$lib/discord/oauth2";
import { decodeToken } from "$lib/server/auth";
import clientAPI from "$lib/server/clientApi";
import { canManageBot } from "$lib/utils/permissions";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import { Routes } from "discord-api-types/v10";
import { setUserWithGuilds } from "$lib/cache/guilds";

export const GET: RequestHandler = async ({ cookies, fetch, url }) => {
  const searchParams = url.searchParams;
  const token = decodeToken(cookies.get("discord-token"), true);
  if (!token) {
    return error(401, "Unauthorized");
  }

  const guildId = searchParams.get("guild_id");
  if (guildId) {
    const guild = await fetch(urls.discordBase + Routes.guild(guildId), {
      method: "GET",
      headers: {
        Authorization: `Bot ${env.discordBotToken}`,
      },
    });
    if (!guild) {
      return error(404, "Guild not found");
    }
    return json(guild);
  }

  let guilds = await fetchUserGuilds(token.userId, token.access_token, fetch, {
    bypassCache: url.searchParams.get("bypass_cache") === "true",
    overwriteCache: false,
  });

  if (searchParams.get("manage_bot_only") === "true") {
    guilds = guilds.filter((guild) => guild.owner || canManageBot(Number(guild.permissions)));
  }

  const validBotGuildIds = await clientAPI.filterMutualGuilds(
    guilds.map((guild) => guild.id),
    token.userId,
  );

  setUserWithGuilds(token.userId, token.access_token, guilds, validBotGuildIds);

  const modifedGuilds = guilds.map((guild) => ({
    ...guild,
    isConfigured: validBotGuildIds.includes(guild.id),
  }));
  return json(modifedGuilds);
};
