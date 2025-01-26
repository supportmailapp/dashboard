import { decodeToken } from "$lib/server/auth.js";

import { createOAuth2Login, getUserGuilds } from "$lib/discord/oauth2";
import clientAPI from "$lib/server/clientApi";
import { apiPartialGuildToPartialGuild } from "$lib/utils/formatting";
import { hasPermission } from "$lib/utils/permissions";
import { error, redirect, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";

const ratelimitBucket = new RateLimiterMemory({
  points: 5,
  duration: 5,
});

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

  // Ratelimiting
  let ratelimit: (RateLimiterRes & { block?: boolean }) | null = null;
  try {
    ratelimit = await ratelimitBucket.consume(locals.currentUser.id, 1);
  } catch (rejRes) {
    ratelimit = rejRes as RateLimiterRes;
    ratelimit.block = true;
  }

  if (ratelimit.block) {
    return error(429, { message: "Rate limited", details: { retryAfter: ratelimit.msBeforeNext } });
  }

  // Fetch user guilds
  if (!locals.guilds) {
    const userGuilds = await getUserGuilds(locals.currentUser.id, tokenData.access_token, fetch);

    if (!userGuilds) {
      return error(500, { message: "Failed to fetch user guilds" });
    }

    const mutualGuilds = await clientAPI.filterMutualGuilds(
      userGuilds.map((g) => g.id),
      locals.currentUser.id,
    );

    locals.guilds = userGuilds
      .filter((g) => hasPermission(g.permissions, 0x20))
      // Sort if setup or not
      .sort((a, b) => {
        const isSetupA = mutualGuilds.includes(a.id);
        const isSetupB = mutualGuilds.includes(b.id);
        if (isSetupA && !isSetupB) return -1;
        else if (!isSetupA && isSetupB) return 1;
        else return 0;
      })
      .map((guild) => apiPartialGuildToPartialGuild(guild, mutualGuilds.includes(guild.id)));
  }

  return {
    guilds: locals.guilds,
    currentGuild: locals.currentGuild,
    currentUser: locals.currentUser,
    redirect: cookies.get("redirect-after-login") || url.searchParams.get("redirect") || null,
  };
} satisfies PageServerLoad;

export const actions = {
  login: async ({ url, cookies }) => {
    const res = createOAuth2Login(url);
    cookies.set("discord-oauth2-state", res.state, { path: "/" });
    if (res.redirectUrl) cookies.set("redirect-after-login", res.redirectUrl, { path: "/" });
    return redirect(303, res.url);
  },
  logout: async ({ cookies }) => {
    cookies.delete("discord-token", { path: "/" });
    return redirect(302, "/");
  },
  reload: ({ url, locals }) => {
    locals.guilds = null;
    return redirect(303, url);
  },
} satisfies Actions;
