import { GuildsManager } from "$lib/stores/GuildsManager.svelte.js";

export async function load({ data }) {
  return {
    user: data.user,
    guildsManager: new GuildsManager(),
  };
}
