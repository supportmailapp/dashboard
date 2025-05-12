// State for the current guild (guild, roles, channels)

import { page } from "$app/state";
import { APIRoutes } from "$lib/urls";
import { BASIC_GET_FETCH_INIT } from "$lib/constants";
import { sortByPositionAndId } from "$lib/utils/formatting";
import { guilds } from "./guilds.svelte";
import type { APIEmoji } from "discord-api-types/v10";
import ky from "ky";

type GGType = {
  guild: DCGuild | null;
  roles: BasicRole[] | null;
  channels: BasicChannel[] | null;
  emojis: APIEmoji[];
};

export const gg = $state<GGType>({
  guild: null,
  roles: null,
  channels: null,
  emojis: [],
});

export function resetGuild() {
  gg.guild = null;
  gg.roles = null;
  gg.channels = null;
}

export async function loadGuildData() {
  const guildId = page.data.guildId;
  if (!guildId) throw new Error("Guild ID is not defined");
  const rolesRes = await ky.get(APIRoutes.roles(guildId), BASIC_GET_FETCH_INIT);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const channelsRes = await ky.get(APIRoutes.channels(guildId), BASIC_GET_FETCH_INIT);

  if (rolesRes.ok && channelsRes.ok) {
    const _roles = await rolesRes.json<BasicRole[]>();
    const _channels = await channelsRes.json<BasicChannel[]>();

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

export async function loadGuildEmojis() {
  const guildId = page.data.guildId;
  if (!guildId) throw new Error("Guild ID is not defined");
  const emojis = await ky.get(APIRoutes.guildEmojis(guildId)).json<APIEmoji[]>();
  gg.emojis = emojis;
}
