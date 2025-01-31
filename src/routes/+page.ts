import { loadGuilds } from "$lib/utils/clientStuff";
import type { PageLoad } from "./$types";

export const load = (async ({ fetch, data, url }) => {
  console.log("Loading page data:", url.toString());
  return {
    ...data,
    guilds: loadGuilds(fetch),
  };
}) satisfies PageLoad;
