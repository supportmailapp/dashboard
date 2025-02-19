// State for the current guild (guild, roles, channels)

import { env } from "$env/dynamic/public";
import { APIRoutes, BASIC_FETCH_INIT, urls } from "$lib/constants";
import { sortByPositionAndId } from "$lib/utils/formatting";
import { guilds } from "./guilds.svelte";
import type { IDBGuild } from "supportmail-types";

type GGType = {
  guild: DCGuild | null;
  config: IDBGuild | null;
  roles: BasicRole[] | null;
  channels: BasicChannel[] | null;
};

export const gg = $state<GGType>({
  guild: null,
  config: null,
  roles: null,
  channels: null,
});

export function resetGuild() {
  gg.guild = null;
  gg.config = null;
  gg.roles = null;
  gg.channels = null;
}

export async function loadGuildData(guildId: string) {
  const rolesRes = await fetch(APIRoutes.roles(guildId), BASIC_FETCH_INIT);
  await new Promise((resolve) => setTimeout(resolve, 500));
  const channelsRes = await fetch(APIRoutes.channels(guildId), BASIC_FETCH_INIT);

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
