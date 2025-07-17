import { JsonErrors } from "$lib/constants";
import { DBGuild } from "$lib/server/db";
import { DiscordUserAPI } from "$lib/server/discord";
import { canManageBot } from "$lib/utils/permissions";
import { error, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals, url }) => {
  if (!(locals.user?.id && locals.token)) return JsonErrors.unauthorized();

  const rest = locals.discordUserRest || new DiscordUserAPI(locals.token.accessToken, locals.user.id);

  const guildsRes = await rest.getCurrentUserGuilds(locals.user.id);
  if (!guildsRes.isSuccess()) {
    return error(guildsRes.status ?? 500);
  }

  const rawGuilds = guildsRes.data!;
  const allGuildIds = rawGuilds.map((g) => g.id);

  // Find all guilds where
  const dbGuilds = await DBGuild.find({ id: { $in: allGuildIds } }, { id: true }, { lean: true });
  const dbGuildIds = dbGuilds.map((dbg) => dbg.id);

  const botGuilds: BotGuild[] = rawGuilds.map((rg) => ({
    ...rg,
    isConfigured: dbGuildIds.includes(rg.id as any),
  }));

  const filterParams = {
    manageBotOnly: url.searchParams.get("manageBot") === "true",
  };

  if (filterParams.manageBotOnly) {
    return Response.json(botGuilds.filter((g) => canManageBot(g.permissions)));
  }

  return Response.json(botGuilds);
};
