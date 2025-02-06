import { writable } from "svelte/store";

export let user = writable<BasicUser | null>(null);
