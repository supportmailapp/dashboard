import { getConfig } from "$lib/cache/configs.js";
import { getDB } from "$lib/db/mongo.js";
import { checkUserGuildAccess } from "$lib/server/auth";
import type { IDBGuild } from "supportmail-types";

export const GET = async ({ params, cookies, request }) => {
  const guildId = params.guildid;
  let token = cookies.get("session");
  if (!token) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Session")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (guildId && token) {
    if (!(await checkUserGuildAccess(token, guildId))) {
      return Response.json(
        {
          message: "You do not have access to this guild",
        },
        { status: 403, statusText: "Forbidden" },
      );
    }

    let config = getConfig(guildId);
    if (!config) {
      const db = getDB();
      const guild = await db.collection("guilds").findOne<IDBGuild>({ id: guildId });
      if (!guild) {
        return Response.json("Not Found", { status: 404, statusText: "Not Found" });
      }
      config = guild;
    }

    return Response.json(config, { status: 200, statusText: "OK" });
  }

  return Response.json("Bad Request", { status: 400, statusText: "Bad Request" });
};
