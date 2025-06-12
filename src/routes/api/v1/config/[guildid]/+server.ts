import { getDBGuild } from "$lib/server/db";
import type { IDBGuild } from "supportmail-types";

export async function GET({ locals }) {
  let config: IDBGuild | any | null = null;
  if (locals.guildId && locals.token) {
    if (!config) {
      const guild = await getDBGuild(locals.guildId);
      if (!guild) {
        return Response.json("Not Found", { status: 404, statusText: "Not Found" });
      }

      config = guild;
    }

    return Response.json(config, { status: 200, statusText: "OK" });
  }

  return Response.json("Bad Request", { status: 400, statusText: "Bad Request" });
}
