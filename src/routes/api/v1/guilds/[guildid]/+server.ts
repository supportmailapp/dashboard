// Only allowed by mods and admins

import { JsonErrors } from "$lib/constants";
import userGuilds from "$lib/server/caches/userGuilds.js";
import { json } from "@sveltejs/kit";

export type PartialGuild = {
  id: string;
  name: string;
  icon: string | null;
  memberCount?: number;
};

export async function GET({ locals, params }) {
  if (!locals.isMod?.() && !locals.isAdmin?.()) {
    return JsonErrors.unauthorized();
  }

  const cached = userGuilds.getGuild(params.guildid);
  let partialGuild: PartialGuild;
  if (!cached) {
    const guildRes = await locals.discordRest.getGuild(params.guildid);
    if (!guildRes.isSuccess()) {
      return JsonErrors.notFound("Guild not found");
    }
    partialGuild = {
      id: guildRes.data.id,
      name: guildRes.data.name,
      icon: guildRes.data.icon,
      memberCount: guildRes.data.approximate_member_count,
    };
  } else {
    partialGuild = {
      id: cached.id,
      name: cached.name,
      icon: cached.icon,
      memberCount: cached.approximate_member_count,
    };
  }

  return json(partialGuild);
}
