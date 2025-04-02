import { BASIC_GET_FETCH_INIT } from "$lib/constants";
import type { IDBGuild } from "supportmail-types";
import { writable } from "svelte/store";

type GGType = {
  /**
   * This can be anything, depending on the route where this store is used.\
   * For example, in the tickets route, this would be the ticket config.\
   * For the reports route, this would be the report config.\
   * ...
   *
   * Initially set to `null`.
   */
  config: any | null;
};

export const configState = $state<GGType>({
  config: null,
});

export let unsavedChanges = writable<boolean>(false);
export let saving = writable<boolean>(false);
export let error = writable<string | null>(null);

error.subscribe((value) => {
  console.log("Error:", value);
});

/**
 * Loads config data from a specified endpoint and sets it in the config store.
 * @param endpoint The endpoint to fetch the config from
 * @param fetchOptions The fetch options to use. Default is a basic GET request.
 */
export async function loadConfig(endpoint: string, fetchOptions: RequestInit = BASIC_GET_FETCH_INIT) {
  const fetchOpts = Object.assign({}, BASIC_GET_FETCH_INIT, fetchOptions);
  console.log(`Fetching config from ${endpoint} with options:`, fetchOpts);
  const configRes = await fetch(endpoint, fetchOpts);
  console.log(`Response status: ${configRes.status}`);

  if (configRes.ok) {
    configState.config = (await configRes.json()) as IDBGuild;
  } else {
    // throw new Error("Failed to fetch guild config", {
    //   cause: configRes,
    // });
    error.set(configRes.statusText);
  }
}
