import { decodeToken } from "$lib/server/auth.js";

import "$env/static/private";
import type { PageServerLoad } from "./$types";
import { redirect, type Actions } from "@sveltejs/kit";
import { getUserGuilds, loginHandler } from "$lib/discord/oauth2";
import clientAPI from "$lib/server/clientApi";
import { apiPartialGuildToPartialGuild } from "$lib/utils/formatting";

export const load = async function ({ cookies, locals, url, fetch }) {
  if (url.pathname == "/?logout=true") {
    cookies.delete("discord-token", { path: "/" });
    return redirect(302, "/");
  }

  const cookieToken = cookies.get("discord-token");
  const tokenData = decodeToken(cookieToken, true);
  if (!tokenData || !locals.currentUser) {
    return {};
  }

  // Fetch user guilds
  if (!locals.guilds) {
    const userGuilds = await getUserGuilds(locals.currentUser.id, tokenData.access_token, fetch);
    if (!userGuilds) {
      return {};
    }

    const mutualGuilds = await clientAPI.filterMutualGuilds(userGuilds.map((g) => g.id));
    locals.guilds = userGuilds.reduce((acc, guild) => {
      if (mutualGuilds.includes(guild.id)) {
        acc.push(apiPartialGuildToPartialGuild(guild));
      }
      return acc;
    }, [] as PartialGuild[]);
  }

  return {
    guilds: locals.guilds,
    currentGuild: locals.currentGuild,
    currentUser: locals.currentUser,
  };
} satisfies PageServerLoad;

export const actions = {
  login: async ({ url }) => {
    console.log("login url", url);
    const res = loginHandler(url);
    console.log("res", res);
    redirect(303, res.url);
  },
} satisfies Actions;
