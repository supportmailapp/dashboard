import { page } from "$app/state";
import { APIRoutes } from "$lib/constants";
import { guild, channels, roles } from "$lib/stores/guild.svelte";
import { guilds } from "$lib/stores/guilds.svelte";
import { sortByPositionAndId } from "./formatting";

const BASIC_FETCH_INIT = {
  method: "GET",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
} as const;

export async function loadGuilds() {
  const _guilds = await fetch(APIRoutes.userGuilds(page.data.user?.id, { manageBotOnly: true }), BASIC_FETCH_INIT);

  if (_guilds.ok) {
    let guildsJson = (await _guilds.json()) as DCGuild[];
    // Sort guilds by configured or not
    guildsJson.sort((a, b) => {
      if (a.isConfigured && !b.isConfigured) return -1;
      if (!a.isConfigured && b.isConfigured) return 1;
      return 0;
    });
    setTimeout(() => guilds.set(guildsJson), 1000);
    return guildsJson;
  }
}

export async function loadGuildData(guildId: string): Promise<{ roles: BasicRole[]; channels: BasicChannel[] }> {
  const rolesRes = await fetch(APIRoutes.roles(guildId), BASIC_FETCH_INIT);
  await new Promise((resolve) => setTimeout(resolve, 500));
  const channelsRes = await fetch(APIRoutes.channels(guildId), BASIC_FETCH_INIT);

  if (rolesRes.ok && channelsRes.ok) {
    const _roles = (await rolesRes.json()) as BasicRole[];
    const _channels = (await channelsRes.json()) as BasicChannel[];

    const sortedChannels = sortByPositionAndId(_channels);
    const sortedRoles = sortByPositionAndId(_roles);
    roles.set(sortedRoles);
    channels.set(sortedChannels);

    return { roles: sortedRoles, channels: sortedChannels };
  } else {
    throw new Error("Failed to fetch guild data");
  }
}
