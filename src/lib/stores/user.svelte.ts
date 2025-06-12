import { page } from "$app/state";

export let DCUser = $derived(page.data.user);
