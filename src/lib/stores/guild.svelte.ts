// State for the current guild (guild, roles, channels)

import { page } from "$app/state";
import { APIRoutes } from "$lib/urls";
import { BASIC_GET_FETCH_INIT } from "$lib/constants";
import { sortByPositionAndId } from "$lib/utils/formatting";
import { guilds } from "./guilds.svelte";

type GGType = {
  guild: DCGuild | null;
  roles: BasicRole[] | null;
  channels: BasicChannel[] | null;
};

export const gg = $state<GGType>({
  guild: null,
  roles: null,
  channels: null,
});

export function resetGuild() {
  gg.guild = null;
  gg.roles = null;
  gg.channels = null;
}

export async function loadGuildData() {
  const guildId = page.data.guildId;
  if (!guildId) throw new Error("Guild ID is not defined");
  const rolesRes = await fetch(APIRoutes.roles(guildId), BASIC_GET_FETCH_INIT);
  await new Promise((resolve) => setTimeout(resolve, 1000));
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
    throw new Error("Failed to fetch guild data", {
      cause: [rolesRes, channelsRes],
    });
  }
}
