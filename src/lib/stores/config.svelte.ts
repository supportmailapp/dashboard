import { writable } from "svelte/store";

/**
 * Just a simple store to hold the old configuration to allow for
 * reverting changes.
 */
export let oldConfig = writable<unknown>(null);

export let unsavedChanges = writable<boolean>(false);
export let saving = $state<{ value: boolean; progress: number | null }>({
  value: false,
  progress: null,
});
export let resetConfig = writable<boolean>(false);
export let configError = writable<{ note: string; objs: unknown[] } | null>(null);

configError.subscribe((value) => {
  if (value) {
    console.error(value);
  }
});
