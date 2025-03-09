import { getConfig, setConfig } from "$lib/cache/configs";
import { getGuild, updateGuild } from "$lib/server/db";
import type { IDBGuild } from "supportmail-types";

export const GET = async ({ locals }) => {
  if (locals.guildId && locals.token) {
    let config: IDBGuild | undefined;
    if (!locals.bypassCache) {
      config = getConfig(locals.guildId);
    }
    if (!config) {
      const guild = await getGuild(locals.guildId);
      if (!guild) {
        return Response.json("Not Found", { status: 404, statusText: "Not Found" });
      }
      config = guild;
      setConfig(locals.guildId, config);
    }

    return Response.json(config, { status: 200, statusText: "OK" });
  }

  return Response.json("Bad Request", { status: 400, statusText: "Bad Request" });
};

export const PATCH = async ({ locals, request }) => {
  if (locals.guildId && locals.token) {
    const update = (await request.json()) as IDBGuild;
    if (!update) {
      return Response.json("Bad Request", { status: 400, statusText: "Bad Request" });
    }

    await updateGuild(locals.guildId, update);
    const newDoc = await getGuild(locals.guildId);
    console.debug("Updated guild", newDoc);
    await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (1200 - 500 + 1)) + 500));
    return Response.json(newDoc, { status: 200, statusText: "OK" });
  }

  return Response.json("Bad Request", { status: 400, statusText: "Bad Request" });
};
