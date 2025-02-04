import { APIRoutes } from "$lib/constants";

export const load = async ({ data, fetch }) => {
  let guilds = data.guilds;
  console.log("Data", data);
  if (!data.guilds && data.user) {
    console.log("Fetching guilds");
    const res = await fetch(APIRoutes.userGuilds(data.user.id, true), { credentials: "include" });
    guilds = (await res.json()) as DCGuild[];
  }

  return { ...data, guilds: guilds };
};
