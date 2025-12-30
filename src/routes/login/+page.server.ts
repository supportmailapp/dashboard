import { env } from "$env/dynamic/private";
import { redirectResponse } from "$lib";
import { discordUrls } from "$lib/urls";

export async function load({ parent }) {
  const { user } = await parent();
  if (user) {
    return redirectResponse(302, "/");
  }
}

export const actions = {
  login: async ({ cookies, url }) => {
    const state = crypto.randomUUID();

    const wasLoggedIn = !!cookies.get("session_id");
    const loginUrl = discordUrls.botAuth(url.origin, { state, wasLoggedIn });

    cookies.set("oauth_state", state, {
      httpOnly: true,
      path: "/login/callback",
      sameSite: "lax",
    });

    return {
      success: true,
      url: loginUrl,
    };
  },
};
