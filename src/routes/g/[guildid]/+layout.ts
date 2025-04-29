import { ConfigState } from "$lib/stores/DataManager.svelte";

export const load = ({ params }) => {
  return {
    dataState: new ConfigState(),
    guildId: params.guildid,
  };
};
