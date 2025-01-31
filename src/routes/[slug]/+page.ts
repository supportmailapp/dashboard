import { Guild } from "$lib/classes/guilds.js";
import { loadGuild, loadGuilds } from "$lib/utils/clientStuff.js";

export const load = async ({ data, url, fetch }) => {
  console.log("Loading page data:", url.toString());
  console.log("Data:", data);

  return {
    ...data,
    guilds: new Promise<Guild[]>((res) => {
      if (data.guilds) {
        res(data.guilds);
      }
      res(loadGuilds(fetch));
    }),
    guild: new Promise<Guild | null>((res) => {
      if (data.guild) {
        res(data.guild);
      }
      res(loadGuild(fetch, data.guildId));
    }),
  };
};
