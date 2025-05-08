/**
 * @fileoverview Discord OAuth2 Utils
 *
 * ### Functions:
 * - handler for login request
 * - handler for callback request
 * - handler for logout request (revoke token)
 * - handler for refresh request
 * - handler for GET user data
 * - handler for GET user guilds
 * - handler for GET guild member data
 */

import { env } from "$env/dynamic/private";
import { cacheDiscordUser } from "$lib/cache/users";
import { createSessionToken, encodeDbTokens } from "$lib/server/auth";
import { discord } from "$lib/server/constants";
import { updateUser } from "$lib/server/db";
import { urls } from "$lib/urls";
import { error, redirect, type RequestHandler } from "@sveltejs/kit";
import { OAuth2Routes, RouteBases, Routes, type APIUser, type RESTPostOAuth2AccessTokenResult } from "discord-api-types/v10";

export const createOAuth2Login = function (url: URL) {
  const redirectUrl = url.searchParams.get("redirect") || null;
  const state = crypto.randomUUID();

  return {
    url: urls.authorize({
      clientId: env.clientId,
      scope: discord.scopes.join(" "),
      state: state,
      promt: "true",
      redirectUri: discord.redirectUri,
    }),
    state: state,
    redirectUrl: redirectUrl,
  };
};

/**
 * Logic:
 * - Check if the state is valid
 * - Exchange the code for an access token
 * - Fetch user data
 * - Create a session token
 * - Set the session cookie
 * - Redirect to server select page
 */
export const callbackHandler: RequestHandler = async ({ url, fetch, cookies }) => {
  const code = url.searchParams.get("code");

  if (!code || url.searchParams.get("state") !== cookies.get("discord-oauth2-state")) {
    return redirect(303, "/");
  }

  cookies.delete("discord-oauth2-state", { path: "/" });

  let oauthRes: Response;
  try {
    oauthRes = await fetch(urls.token(), {
      method: "POST",
      body: new URLSearchParams({
        client_id: discord.clientId,
        client_secret: discord.clientSecret,
        grant_type: "authorization_code",
        redirect_uri: discord.redirectUri,
        code: String(code),
        scope: discord.scopes.join(" "),
      }).toString(),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });
    if (!oauthRes.ok) throw oauthRes;
  } catch (err: any) {
    console.error(err);
    return error(500, {
      message: err?.message || "Failed to exchange code for token",
    });
  }

  const oauthResJson = (await oauthRes.json()) as RESTPostOAuth2AccessTokenResult;

  let userData: APIUser;
  try {
    const userRes = await fetch(RouteBases.api + Routes.user(), {
      method: "GET",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${oauthResJson.access_token}`,
      },
    });

    if (!userRes.ok) throw { message: "Failed to fetch user data" };

    userData = (await userRes.json()) as APIUser;
  } catch (err: any) {
    console.error(err);
    return error(500, {
      message: err?.message || "Failed to fetch user data",
    });
  }

  cacheDiscordUser(userData);
  await updateUser(
    userData.id,
    {
      tokens: encodeDbTokens(oauthResJson),
    },
    true,
  );

  const session = createSessionToken(userData.id);

  cookies.set("session", session, {
    path: "/",
    maxAge: oauthResJson.expires_in,
  });

  redirect(303, "/");
};

/**
 * Logic:
 * - Revoke token, remove it from cache
 * - Clear cookie
 * - Redirect to home page
 */
export const logoutHandler: RequestHandler = async ({ cookies, fetch, locals }) => {
  const token = locals.token;
  if (!token) return redirect(302, "/");

  cookies.delete("session", { path: "/" });

  try {
    await fetch(OAuth2Routes.tokenRevocationURL, {
      method: "POST",
      body: new URLSearchParams({
        client_id: discord.clientId,
        client_secret: discord.clientSecret,
        token_type_hint: "access_token",
        token: token,
      }).toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  } catch (error) {
    console.error("Token Revocation Error:", error);
  }

  return redirect(302, "/login");
};
