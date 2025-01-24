import { decodeToken } from "$lib/server/auth.js";

import "$env/static/private";
import type { PageServerLoad } from "./$types";
import { redirect, type Actions } from "@sveltejs/kit";
import { loginHandler } from "$lib/discord/oauth2";

export const load = async function ({ cookies, locals }) {
  const cookieToken = cookies.get("discord-token");
  if (!cookieToken) {
    return {};
  }

  const tokenData = decodeToken(cookieToken);
  if (!tokenData) {
    return {};
  }

  // Fetch user data from Discord API
  // Return server list
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
