import { BASIC_GET_FETCH_INIT } from "$lib/constants";
import type { IDBGuild } from "supportmail-types";
import { writable } from "svelte/store";

/**
 * This can be used to store ANY config data. It is not type-safe and should be used with caution.
 *
 * It's recommended to use a derived state on each page for type safety.
 */
export const configStore = writable<any | null>(null);

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
    configStore.set((await configRes.json()) as IDBGuild);
  } else {
    // throw new Error("Failed to fetch guild config", {
    //   cause: configRes,
    // });
    error.set(configRes.statusText);
  }
}
