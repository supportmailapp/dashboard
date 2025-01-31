import { Guild } from "$lib/classes/guilds";
import { API_BASE } from "$lib/constants";
import type { RESTAPIPartialCurrentUserGuild } from "discord-api-types/v10";

export const loadUserGuilds = async (fetch: Function): Promise<Guild[]> => {
  return fetch(API_BASE + "/guilds", {
    method: "GET",
    credentials: "include",
  }).then(async (res: any) => {
    if (!res.ok) {
      throw res;
    }

    const jsonData = (await res.json()) as (RESTAPIPartialCurrentUserGuild & { isConfigured: boolean })[];
    return jsonData
      .filter((guild) => Number(guild.permissions) & 0x28)
      .sort((a, b) => (a.isConfigured === b.isConfigured ? 1 : a.isConfigured ? -1 : 0))
      .map((g) => Guild.from(g, g.isConfigured));
  });
};

export const loadGuild = async (fetch: Function, guildId: Guild): Promise<Guild> => {
  return fetch(API_BASE + `/guilds?guild_id=${guildId}`, {
    method: "GET",
    credentials: "include",
  }).then(async (res: any) => {
    if (!res.ok) {
      throw res;
    }

    const jsonData = (await res.json()) as RESTAPIPartialCurrentUserGuild & { isConfigured: boolean };
    return Guild.from(jsonData, jsonData.isConfigured);
  });
};
