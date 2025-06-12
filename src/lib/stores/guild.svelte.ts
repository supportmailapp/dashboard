// State for the current guild (guild, roles, channels)

import { page } from "$app/state";
import { APIRoutes } from "$lib/urls.js";
import { sortByPositionAndId } from "$lib/utils/formatting.js";
import type { APIRole } from "discord-api-types/v10";
import { BasicFetchInit } from "$lib/constants";
import ky from "ky";

type GGType = {
  guild: DCGuild | null;
  roles: APIRole[] | null;
  channels: GuildCoreChannel[] | null;
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
  // TODO: Implement
}
