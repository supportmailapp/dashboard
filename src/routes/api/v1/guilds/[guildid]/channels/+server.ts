import { JsonErrors } from "$lib/constants";
import { getGuildChannels, setGuildCache } from "$lib/server/caches/guilds.js";

export async function GET({ locals, params, url, setHeaders }) {
  const bypassCache = url.searchParams.get("cache") === "false";

  if (!bypassCache) {
    const cachedChannels = getGuildChannels(params.guildid);
    if (cachedChannels) {
      console.log("GET /api/v1/guilds/[guildid]/channels - Cache hit");
      setHeaders({ "Cache-Status": "HIT" });
      return Response.json(cachedChannels, {
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  setHeaders({ "Cache-Status": "MISS" });

  const res = await locals.discordRest.getGuildChannels(params.guildid);

  if (!res.isSuccess()) {
    return new Response(JSON.stringify(res.error), {
      status: res.status ?? 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  setGuildCache(params.guildid, {
    channels: res.data ?? [],
  });

  return Response.json(res.data, {
    headers: { "Content-Type": "application/json" },
  });
}
