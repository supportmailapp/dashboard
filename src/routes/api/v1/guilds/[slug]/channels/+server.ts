import { getGuildChannels, setGuildChannels } from "$lib/cache/guilds";
import { discordREST } from "$lib/discord/utils";
import { checkUserGuildAccess } from "$lib/server/auth";
import { apiChannelToBasic } from "$lib/utils/formatting";
import { json, type RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ params, cookies }) => {
  const guildId = params.slug;
  const token = cookies.get("session_token");

  if (guildId && token) {
    if (!(await checkUserGuildAccess(token, guildId))) {
      return Response.json(
        {
          message: "You do not have access to this guild",
        },
        { status: 403, statusText: "Forbidden" },
      );
    }
    
    const cachedChannels = getGuildChannels(guildId);
    if (cachedChannels) return json(cachedChannels, { status: 200, statusText: "OK" });

    try {
      const channels = await discordREST.getGuildChannels(guildId);
      setGuildChannels(
        guildId,
        channels.map((c) => apiChannelToBasic(c)),
      );
      return json(channels.reverse(), { status: 200, statusText: "OK" });
    } catch (err: any) {
      return json(
        {
          message: err.message || "Internal Server Error",
          details: err,
        },
        { status: err.status || 500, statusText: err.statusText || "Internal Server Error" },
      );
    }
  }

  return Response.json("Bad Request", { status: 400, statusText: "Bad Request" });
};
