import { APIRoutes } from "$lib/urls";
import apiClient from "$lib/utils/apiClient";
import type { PartialGuild } from "$v1Api/guilds/[guildid]/+server";
import { SvelteMap } from "svelte/reactivity";

export const guilds = new SvelteMap<string, PartialGuild>();

export async function fetchGuild(guildId: string): Promise<PartialGuild | null> {
  if (guilds.has(guildId)) {
    return guilds.get(guildId)!;
  }
  const res = await apiClient.get<PartialGuild>(APIRoutes.guild(guildId));
  if (res.ok) {
    const data = await res.json();
    guilds.set(guildId, data);
    return data;
  }
  return null;
}
