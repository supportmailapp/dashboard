import { env } from "$env/dynamic/private";
import { discordUrls } from "$lib/urls";
import { SnowflakeSchema } from "$v1Api/assertions.js";
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

    const wasLoggedIn = !!cookies.get("was_logged_in");
    const loginUrl = discordUrls.botAuth(url.origin, { state, wasLoggedIn });

    cookies.set("oauth_state", state, {
      httpOnly: true,
      path: "/login/callback",
      sameSite: "lax",
    });

    if (url.searchParams.get("dm") && SnowflakeSchema.safeParse(url.searchParams.get("dm")).success) {
      cookies.set("post_login_redirect", JSON.stringify({ dm: url.searchParams.get("dm") }), {
        httpOnly: true,
        path: "/",
      });
    }

    return {
      success: true,
      url: loginUrl,
    };
  },
};
