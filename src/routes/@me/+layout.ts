import { ConfigState } from "$lib/stores/DataManager.svelte";

export const load = () => {
  return {
    dataState: new ConfigState(),
  };
};
