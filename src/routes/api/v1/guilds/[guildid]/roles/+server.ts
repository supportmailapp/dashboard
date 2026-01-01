import { getGuildRoles, setGuildCache } from "$lib/server/caches/guilds.js";

export async function GET({ locals, params, url, setHeaders }) {
  const bypassCache = url.searchParams.get("cache") === "false";

  if (!bypassCache) {
    const cachedChannels = getGuildRoles(params.guildid);
    if (cachedChannels) {
      console.log("GET /api/v1/guilds/[guildid]/roles - Cache hit");
      setHeaders({ "Cache-Status": "HIT" });
      return Response.json(cachedChannels, {
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  setHeaders({ "Cache-Status": "MISS" });

  const res = await locals.discordRest.getGuildRoles(params.guildid);

  console.log("GET /api/v1/guilds/[guildid]/roles", res);

  if (!res.isSuccess()) {
    return new Response(JSON.stringify(res.error), {
      status: res.status ?? 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  setGuildCache(params.guildid, {
    roles: res.data,
  });

  return Response.json(res.data, {
    headers: { "Content-Type": "application/json" },
  });
}
