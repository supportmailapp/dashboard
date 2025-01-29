import { BasicGuild } from "$lib/classes/guilds";
import { API_BASE } from "$lib/constants";
import type { RESTAPIPartialCurrentUserGuild } from "discord-api-types/v10";

export const loadUserGuilds = (fetch: Function): Promise<BasicGuild[]> => {
  return fetch(API_BASE + "/user-guilds", {
    method: "GET",
    credentials: "include",
  })
    .then(async (res: any) => {
      if (!res.ok) {
        throw res;
      }

      const jsonData = (await res.json()) as (RESTAPIPartialCurrentUserGuild & { isConfigured: boolean })[];
      return jsonData
        .filter((guild) => Number(guild.permissions) & 0x28)
        .sort((a, b) => (a.isConfigured === b.isConfigured ? 1 : a.isConfigured ? -1 : 0))
        .map((g) => BasicGuild.from(g, g.isConfigured));
    })
    .catch((error: any) => {
      console.error(error);
      throw new Error("Failed to fetch guilds");
    });
};
