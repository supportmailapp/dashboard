import { env } from "$env/dynamic/private";
import { overwriteUserGuilds } from "$lib/cache/guilds";
import { getToken } from "$lib/cache/users";
import { fetchUserGuilds } from "$lib/discord/oauth2";
import clientAPI from "$lib/server/clientApi";
import { canManageBot } from "$lib/utils/permissions";
import { error, json, type RequestHandler } from "@sveltejs/kit";
import { RouteBases, Routes, type APIGuild } from "discord-api-types/v10";

export const GET: RequestHandler = async ({ fetch, params, locals, url }) => {
  const guildId = params.slug;
  if (guildId) {
    const guildRes = await fetch(RouteBases.api + Routes.guild(guildId), {
      method: "GET",
      headers: {
        Authorization: `Bot ${env.discordBotToken}`,
      },
    });
    const jsonGuild = (await guildRes.json()) as APIGuild;
    if (!jsonGuild) {
      return error(404, "Guild not found");
    }
    return json(jsonGuild);
  }

  const aToken = getToken(locals.user.id);
  if (!aToken) return error(401, "Unauthorized");

  let guilds = await fetchUserGuilds(locals.user.id, aToken, fetch, {
    bypassCache: url.searchParams.get("bypass_cache") === "true",
    overwriteCache: false,
  });

  if (url.searchParams.get("manage_bot_only") === "true") {
    guilds = guilds.filter((guild) => canManageBot(Number(guild.permissions)));
  }

  const validBotGuildIds = await clientAPI.filterMutualGuilds(
    guilds.map((guild) => guild.id),
    aToken,
  );

  const modifedGuilds = guilds.map((guild) => ({
    ...guild,
    isConfigured: validBotGuildIds.includes(guild.id),
  }));
  overwriteUserGuilds(locals.user.id, modifedGuilds);
  return json(modifedGuilds);
};
