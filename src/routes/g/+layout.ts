import { GuildsManager } from "$lib/stores/GuildsManager.svelte";

export async function load({ parent }) {
  const data = await parent();
  return {
    ...data,
  };
}
