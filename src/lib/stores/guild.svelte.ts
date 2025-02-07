// State for the current guild (guild, roles, channels)

import { APIRoutes, BASIC_FETCH_INIT } from "$lib/constants";
import { sortByPositionAndId } from "$lib/utils/formatting";

export const currentGuild = $state<{ g: DCGuild | null; roles: BasicRole[] | null; channels: BasicChannel[] | null }>({
  g: null,
  roles: null,
  channels: null,
});

export function resetGuild() {
  currentGuild.g = null;
  currentGuild.roles = null;
  currentGuild.channels = null;
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
    currentGuild.roles = sortedRoles;
    currentGuild.channels = sortedChannels;
  } else {
    throw new Error("Failed to fetch guild data");
  }
}
