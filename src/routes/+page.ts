import { loadUserGuilds } from "$lib/utils/clientStuff";
import type { PageLoad } from "./$types";

export const load = (async ({ fetch, data }) => {
  console.log("Loading page data");
  return {
    ...data,
    guilds: loadUserGuilds(fetch),
  };
}) satisfies PageLoad;
