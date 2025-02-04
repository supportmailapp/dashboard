import { Guild } from "$lib/classes/guilds";
import { API_BASE } from "$lib/constants";
import type { APIRole, RESTAPIPartialCurrentUserGuild } from "discord-api-types/v10";

export async function loadGuilds(fetch: Function, asJSON: true): Promise<DCGuild[]>;
export async function loadGuilds(fetch: Function, asJSON?: boolean): Promise<Guild[]>;

export async function loadGuilds(fetch: Function, asJSON = false) {
  return fetch(API_BASE + "/guilds", {
    method: "GET",
    credentials: "include",
  }).then(async (res: any) => {
    if (!res.ok) {
      throw res;
    }

    const jsonData = (await res.json()) as (RESTAPIPartialCurrentUserGuild & { isConfigured: boolean })[];
    const guilds = jsonData
      .filter((guild) => Number(guild.permissions) & 0x28)
      .sort((a, b) => (a.isConfigured === b.isConfigured ? 1 : a.isConfigured ? -1 : 0))
      .map((g) => Guild.from(g, g.isConfigured));

    if (asJSON) {
      return guilds.map((guild) => guild.toJSON());
    }

    return guilds;
  });
}

export async function loadGuild(fetch: Function, guildId: string, asJSON: true): Promise<DCGuild>;
export async function loadGuild(fetch: Function, guildId: string, asJSON?: boolean): Promise<Guild>;

export async function loadGuild(fetch: Function, guildId: string, asJSON: boolean = false) {
  return fetch(API_BASE + `/guilds?guild_id=${guildId}`, {
    method: "GET",
    credentials: "include",
  }).then(async (res: any) => {
    if (!res.ok) {
      throw res;
    }

    const jsonData = (await res.json()) as RESTAPIPartialCurrentUserGuild & {
      isConfigured: boolean;
      channels: APDCGuildCoreChannel[];
      roles: APIRole[];
    };

    if (!jsonData) {
      return undefined;
    }

    const guild = Guild.from(jsonData, jsonData.isConfigured);

    guild.setChannels(
      jsonData.channels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        position: channel.position,
        type: channel.type,
      })),
    );

    guild.setRoles(
      jsonData.roles.map((role) => ({
        id: role.id,
        name: role.name,
        permissions: role.permissions,
        position: role.position,
        color: role.color,
      })),
    );

    if (asJSON) {
      return guild.toJSON();
    }

    return guild;
  });
}
