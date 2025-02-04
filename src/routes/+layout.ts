import { APIRoutes } from "$lib/constants";

export const load = async ({ data, fetch }) => {
  let guilds = data.guilds;
  if (!data.guilds && data.user) {
    const res = await fetch(APIRoutes.userGuilds(data.user.id), { credentials: "include" });
    guilds = (await res.json()) as DCGuild[];
  }

  return { ...data, guilds: guilds };
};
