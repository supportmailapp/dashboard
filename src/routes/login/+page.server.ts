import { env } from "$env/dynamic/private";
import { discordUrls } from "$lib/urls";
import { redirect } from "@sveltejs/kit";
import jwt from "jsonwebtoken";

export async function load({ parent, cookies, url }) {
  const { user } = await parent();

  if (user) {
    return redirect(302, "/");
  }

  cookies.set(
    "img_token",
    jwt.sign({ foo: crypto.randomUUID() }, env.JWT_SECRET, {
      algorithm: "HS512",
      audience: "supportmail-website",
      issuer: "supportmail-website/login",
      subject: "img-access",
      expiresIn: "1h",
    }),
    { path: "/" },
  );

  return {};
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
