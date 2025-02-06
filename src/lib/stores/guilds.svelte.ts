import { writable } from "svelte/store";

export let guilds = writable<DCGuild[] | null>(null);
