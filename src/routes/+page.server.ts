import { decodeToken } from "$lib/server/auth.js";

import { createOAuth2Login, getUserData } from "$lib/discord/oauth2";
import { apiUserToCurrentUser } from "$lib/utils/formatting";
import { redirect, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const prerender = false;

// const valkey = new Valkey(); // TODO: use this to cache guilds in a seperate file

export const load = async function ({ cookies, locals, url, fetch }) {
  if (url.pathname == "/?logout=true") {
    cookies.delete("discord-token", { path: "/" });
    return {};
  }

  const cookieToken = cookies.get("discord-token");
  const tokenData = decodeToken(cookieToken, true);
  if (!tokenData) {
    return {};
  }

  if (!locals.user) {
    const user = await getUserData(tokenData.access_token, fetch, tokenData.userId);
    locals.user = apiUserToCurrentUser(user);
  }

  return {
    user: locals.user,
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
