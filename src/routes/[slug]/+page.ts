import * as ClientStuff from "$lib/utils/clientStuff";
import type { PageLoad } from "../$types";

export const load: PageLoad = async ({ fetch, data, url }) => {
  console.log("Loading page data:", url.toString());
  return {
    ...data,
    guilds: ClientStuff.loadGuilds(fetch),
  };
};
