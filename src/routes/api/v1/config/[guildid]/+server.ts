import { getConfig, setConfig } from "$lib/cache/configs";
import { getGuild, updateGuild } from "$lib/server/db";
import type { IDBGuild } from "supportmail-types";

export const GET = async ({ locals }) => {
  if (locals.guildId && locals.token) {
    console.log(`GET request for guild: ${locals.guildId}, bypassCache: ${locals.bypassCache}`);
    let config: IDBGuild | undefined;
    if (!locals.bypassCache) {
      console.log(`Attempting to get config from cache for guild: ${locals.guildId}`);
      config = getConfig(locals.guildId);
      console.log(`Cache result: ${config ? 'Config found in cache' : 'Config not found in cache'}`);
    } else {
      console.log('Cache bypass requested, fetching directly from database');
    }
    
    if (!config) {
      console.log(`Fetching guild data from database for: ${locals.guildId}`);
      const guild = await getGuild(locals.guildId);
      if (!guild) {
        console.log(`Guild not found in database: ${locals.guildId}`);
        return Response.json("Not Found", { status: 404, statusText: "Not Found" });
      }
      console.log(`Guild found in database: ${locals.guildId}`);
      config = guild;
      console.log(`Updating cache for guild: ${locals.guildId}`);
      setConfig(locals.guildId, config);
    }

    console.log(`Returning config for guild: ${locals.guildId}`);
    return Response.json(config, { status: 200, statusText: "OK" });
  }

  console.log('Bad request: Missing guildId or token');
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
