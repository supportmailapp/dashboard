import { decodeToken } from "$lib/server/auth.js";

import "$env/static/private";
import type { PageServerLoad } from "./$types";

export const load = async function ({ params, cookies, fetch, locals, request, url }) {
  const cookieToken = cookies.get("user_token");
  if (!cookieToken) {
    return { status: 401, redirect: "/login" };
  }

  const tokenData = decodeToken(cookieToken);
  if (!tokenData) {
    return { status: 401, redirect: "/login" };
  }

  // Fetch user data from Discord API
  // Return server list
} satisfies PageServerLoad;
