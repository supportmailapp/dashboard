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
import ky from "ky";

type OAuth2LoginOpts = {
  url: URL;
  prompt: "true" | "none";
  joinDiscord: boolean;
};

export const createOAuth2Login = function (opts: OAuth2LoginOpts) {
  // TODO: Add redirect logic
  // const redirectUrl = opts.url.searchParams.get("redirect") || null;
  const state = crypto.randomUUID();

  const scopes = discord.scopes as unknown as string[];
  if (opts.joinDiscord) {
    scopes.push("guilds.join");
  }

  return {
    url: urls.authorize({
      clientId: env.clientId,
      scope: scopes.join(" "),
      state: state,
      prompt: opts.prompt,
      redirectUri: discord.redirectUri,
    }),
    state: state,
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

    // Check if the user has the guilds.join scope by seeing if it's in the granted scopes
    const grantedScopes = oauthResJson.scope.split(" ");
    if (grantedScopes.includes("guilds.join") && env.PUBLIC_SupportServer) {
      try {
        // Add user to the specified guild using Discord API
        const joinRes = await ky.put(`${RouteBases.api}${Routes.guildMember(env.PUBLIC_SupportServer, userData.id)}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bot ${env.botToken}`,
          },
          json: {
            access_token: oauthResJson.access_token,
          },
        });

        if (!joinRes.ok) {
          console.error("Failed to add user to guild:", await joinRes.text());
        }
      } catch (joinErr) {
        // Log the error but continue with the authentication process
        console.error("Error adding user to guild:", joinErr);
      }
    }
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
