import { APIRoutes } from "$lib/constants.js";

export const load = async ({ data, fetch, params }) => {
  if (!data.guilds) {
    const res = await fetch(APIRoutes.userGuilds(data.user.id), { credentials: "include" });
    data.guilds = (await res.json()) as DCGuild[];
  }

  const guildId = params.slug;

  const channelRes = await fetch(APIRoutes.channels(guildId), { credentials: "include" });
  const channels = (await channelRes.json()) as BasicChannel[];

  const rolesRes = await fetch(APIRoutes.roles(guildId), { credentials: "include" });
  const roles = (await rolesRes.json()) as BasicRole[];

  return {
    ...data,
    guildId: guildId,
    guild: data.guilds.find((g) => g.id === guildId),
    channels: channels,
    roles: roles,
  };
};
