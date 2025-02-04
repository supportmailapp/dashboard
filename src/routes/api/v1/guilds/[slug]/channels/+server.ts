import { getGuildChannels, setGuildChannels } from "$lib/cache/guilds";
import { discordREST } from "$lib/discord/utils";
import { apiChannelToBasic } from "$lib/utils/formatting";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ params }) => {
  const guildId = params.slug;

  if (guildId) {
    const cachedChannels = getGuildChannels(guildId);
    if (cachedChannels) return Response.json(cachedChannels, { status: 200, statusText: "OK" });

    try {
      const channels = await discordREST.getGuildChannels(guildId);
      setGuildChannels(
        guildId,
        channels.map((c) => apiChannelToBasic(c)),
      );
      return Response.json(channels, { status: 200, statusText: "OK" });
    } catch (err: any) {
      return Response.json(
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
