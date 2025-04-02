import { getGuildChannels, setGuildChannels } from "$lib/cache/guilds";
import { DiscordREST } from "$lib/discord/utils";
import { apiChannelToBasic } from "$lib/utils/formatting";
import { json } from "@sveltejs/kit";

const discordREST = new DiscordREST();

export const GET = async ({ locals }) => {
  const guildId = locals.guildId;
  const token = locals.token;

  if (guildId && token) {
    const cachedChannels = getGuildChannels(guildId);
    console.log("Cached channels", cachedChannels);
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
