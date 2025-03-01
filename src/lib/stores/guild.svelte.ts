// State for the current guild (guild, roles, channels)

import { env } from "$env/dynamic/public";
import { APIRoutes, BASIC_GET_FETCH_INIT, urls } from "$lib/constants";
import { sortByPositionAndId } from "$lib/utils/formatting";
import type { IDBGuild } from "supportmail-types";
import { guilds } from "./guilds.svelte";

type GGType = {
  guild: DCGuild | null;
  oldConfig: IDBGuild | null;
  newConfig: IDBGuild | null;
  roles: BasicRole[] | null;
  channels: BasicChannel[] | null;
};

export const gg = $state<GGType>({
  guild: null,
  oldConfig: null,
  newConfig: null,
  roles: null,
  channels: null,
});

export const unsavedChanges = $state(gg.oldConfig != gg.newConfig);

export function resetGuild() {
  gg.guild = null;
  gg.oldConfig = null;
  gg.newConfig = null;
  gg.roles = null;
  gg.channels = null;
}

export async function loadGuildData(guildId: string) {
  const rolesRes = await fetch(APIRoutes.roles(guildId), BASIC_GET_FETCH_INIT);
  await new Promise((resolve) => setTimeout(resolve, 500));
  const channelsRes = await fetch(APIRoutes.channels(guildId), BASIC_GET_FETCH_INIT);

  if (rolesRes.ok && channelsRes.ok) {
    const _roles = (await rolesRes.json()) as BasicRole[];
    const _channels = (await channelsRes.json()) as BasicChannel[];

    const sortedChannels = sortByPositionAndId(_channels);
    const sortedRoles = sortByPositionAndId(_roles);
    gg.guild = guilds.get().find((g) => g.id === guildId) || null;
    gg.roles = sortedRoles.reverse(); // Reverse because we want the highest role to be at the top
    gg.channels = sortedChannels;
  } else {
    if (rolesRes.status == 404 || channelsRes.status == 404) {
      window.open(urls.botAuth(env.PUBLIC_ClientId, guildId));
    } else {
      throw new Error("Failed to fetch guild data", {
        cause: [rolesRes, channelsRes],
      });
    }
  }
}

export async function loadGuildConfig(guildId: string) {
  const configRes = await fetch(APIRoutes.config.base(guildId), BASIC_GET_FETCH_INIT);
  if (configRes.ok) {
    gg.oldConfig = (await configRes.json()) as IDBGuild;
    gg.newConfig = $state.snapshot(gg.oldConfig) as IDBGuild;
  } else {
    throw new Error("Failed to fetch guild config", {
      cause: configRes,
    });
  }
}
