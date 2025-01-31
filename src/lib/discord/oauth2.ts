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
import * as UserGuildsCache from "$lib/cache/guilds";
import * as UserCache from "$lib/cache/users";
import { urls } from "$lib/constants";
import { decodeToken, encodeToken } from "$lib/server/auth";
import { discord } from "$lib/server/constants";
import { error, redirect, type RequestHandler } from "@sveltejs/kit";
import {
  OAuth2Routes,
  Routes,
  type APIUser,
  type RESTAPIPartialCurrentUserGuild,
  type RESTPostOAuth2AccessTokenResult,
} from "discord-api-types/v10";
import { generateSessionId } from "./utils";

export const createOAuth2Login = function (url: URL) {
  const redirectUrl = url.searchParams.get("redirect") || null;
  const state = crypto.randomUUID();

  return {
    status: 302,
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

export const callbackHandler: RequestHandler = async ({ url, fetch, cookies }) => {
  const code = url.searchParams.get("code");

  if (!code) {
    return error(405, 'A "code" query parameter must be present in the URL.');
  }

  if (url.searchParams.get("state") !== cookies.get("discord-oauth2-state")) {
    return error(403, "Invalid state parameter");
  }

  cookies.delete("discord-oauth2-state", { path: "/" });

  const redirectUrl = cookies.get("redirect-after-login");
  cookies.delete("redirect-after-login", { path: "/" });

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
    if (!oauthRes.ok) throw { message: "Failed to exchange code for token" };
  } catch (err: any) {
    console.error(err);
    return error(500, err.message);
  }

  const oauthResJson = (await oauthRes.json()) as RESTPostOAuth2AccessTokenResult;

  let userData: APIUser;
  try {
    userData = await fetchUserData(oauthResJson.access_token, fetch);
  } catch (err: any) {
    console.error(err);
    return error(500, {
      message: err?.message,
    });
  }

  const sessionId = generateSessionId();

  const eToken = encodeToken({
    sessionId: sessionId,
    access_token: oauthResJson.access_token,
    refresh_token: oauthResJson.refresh_token,
    expires_at: new Date(Date.now() + oauthResJson.expires_in * 1000).toISOString(),
    userId: userData.id,
  });

  cookies.set("discord-token", eToken, {
    path: "/",
    maxAge: 1_209_600,
    // sameSite: "strict",
  });

  redirect(302, redirectUrl || "/");
};

/**
 * Refreshes the OAuth2 token using the provided encoded token cookie.
 *
 * @returns A promise that resolves to the new encoded token.
 * @throws {Object} Throws an error object with status, message and hint properties.
 *
 * `hint` can be: `"login"`
 */
export async function refreshToken(encodedTokenCookie: string, fetch: Function) {
  const token = decodeToken(encodedTokenCookie);
  if (!token || typeof token?.refresh_token !== "string") {
    throw { status: 400, message: "Invalid token", hint: "login" };
  }

  let oauthRes: Response;
  try {
    oauthRes = await fetch(urls.token(), {
      method: "POST",
      body: new URLSearchParams({
        client_id: discord.clientId,
        client_secret: discord.clientSecret,
        grant_type: "refresh_token",
        refresh_token: token.refresh_token,
        scope: discord.scopes.join(" "),
      }).toString(),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    if (!oauthRes.ok) throw { status: 500, message: "Failed to refresh token" };
  } catch (err: any) {
    console.error("Error refreshing token:", err);
    throw { status: 500, message: err.message, hint: "login" };
  }

  const oauthResJson = (await oauthRes.json()) as RESTPostOAuth2AccessTokenResult;

  let userData: APIUser;
  try {
    userData = await fetchUserData(oauthResJson.access_token, fetch); // Bypass cache
  } catch (err: any) {
    console.error(err);
    throw { status: 500, message: "Failed to fetch user data", hint: "login" };
  }

  const sessionId = generateSessionId();

  const eToken = encodeToken({
    sessionId: sessionId,
    access_token: oauthResJson.access_token,
    refresh_token: oauthResJson.refresh_token,
    expires_at: new Date(Date.now() + oauthResJson.expires_in * 1000).toISOString(),
    userId: userData.id,
  });

  return {
    eToken,
    sessionId,
  };
}

export const logoutHandler: RequestHandler = async ({ url, request, cookies, fetch }) => {
  // Revoke token, remove it from cache
  // Clear cookie
  // Redirect to home page

  const token = decodeToken(cookies.get("discord-token"));
  if (!token || typeof token?.access_token !== "string") {
    return redirect(302, "/");
  }

  let res: Response;
  try {
    res = await fetch(OAuth2Routes.tokenRevocationURL, {
      method: "POST",
      body: new URLSearchParams({
        client_id: discord.clientId,
        client_secret: discord.clientSecret,
        token_type_hint: "access_token",
        token: token.access_token,
      }).toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  } catch (error) {
    console.error("Token Revocation Error:", error);
  }

  cookies.delete("discord-token", { path: "/" });
  return redirect(302, "/");
};

/**
 * Fetches user data from the Discord API using the provided access token.
 * If a user ID is provided, it first attempts to retrieve the user data from the cache.
 * If the data is not found in the cache, it fetches the data from the API and caches it for future use.
 *
 * @returns A promise that resolves to the user data.
 * @throws Will throw an error if the API request fails. Format: `{ status: number, message: string }`
 */
export async function fetchUserData(accessToken: string, fetch: Function, userId: string | null = null): Promise<APIUser> {
  if (userId) {
    const cachedData = UserCache.get(userId);
    if (cachedData) {
      return cachedData;
    }
  }

  const userRes = await fetch(urls.discordBase + Routes.user(), {
    method: "GET",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userRes.ok) {
    throw userRes;
  }

  const userResJson = (await userRes.json()) as APIUser;
  UserCache.set(userResJson);
  return userResJson;
}

interface FetchUserGuildsOptions {
  /**
   * Whether to bypass the cache and fetch fresh data from the API. Defaults to `false`.
   */
  bypassCache?: boolean;
  /**
   * Whether to overwrite the cache with the fetched data. Defaults to `true`.
   *
   * **If set to `false`, then the fetched data MUST be overwritten manually to ensure the cache is up-to-date.**
   */
  overwriteCache?: boolean;
}

/**
 * Fetches the guilds that the current user guilds from the Cache or Discord API.
 *
 * @param userId - The ID of the user whose guilds are to be fetched.
 * @param accessToken - The access token for authenticating the request.
 * @param fetch - The fetch function to make the HTTP request.
 * @param options - Options for fetching user guilds.
 * @returns A promise that resolves to an array of partial guild objects.
 * @throws An error object containing the status and message if the request fails.
 */
export async function fetchUserGuilds(
  userId: string,
  accessToken: string,
  fetch: Function,
  options: FetchUserGuildsOptions = {},
): Promise<RESTAPIPartialCurrentUserGuild[]> {
  options = Object.assign({ bypassCache: false, overwriteCache: true }, options);
  if (!options.bypassCache) {
    const cachedGuilds = UserGuildsCache.getUserGuilds(userId, accessToken);
    if (cachedGuilds) {
      return cachedGuilds.guilds;
    }
  }

  const guildRes = await fetch(urls.discordBase + Routes.userGuilds(), {
    method: "GET",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!guildRes.ok) {
    throw { status: guildRes.status, message: guildRes.statusText };
  }

  const guildResJson = (await guildRes.json()) as RESTAPIPartialCurrentUserGuild[];
  if (options.overwriteCache) {
    UserGuildsCache.setUserWithGuilds(userId, accessToken, guildResJson);
  }
  return guildResJson;
}
