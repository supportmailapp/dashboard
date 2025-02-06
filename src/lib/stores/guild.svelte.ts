// State for the current guild (guild, roles, channels)

import { writable } from "svelte/store";

export let guild = writable<DCGuild | null>(null);
export let roles = writable<BasicRole[] | null>(null);
export let channels = writable<BasicChannel[] | null>(null);

export function resetGuild() {
  guild.set(null);
  roles.set(null);
  channels.set(null);
}
