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
import { getUserGuilds, parseToCacheGuild } from "$lib/cache/guilds";
import { cacheUser, getToken, getUser } from "$lib/cache/users";
import { urls } from "$lib/constants";
import { createSessionToken, verifySessionToken } from "$lib/server/auth";
import { discord } from "$lib/server/constants";
import { error, redirect, type RequestHandler } from "@sveltejs/kit";
import {
    OAuth2Routes,
    RouteBases,
    Routes,
    type APIUser,
    type RESTAPIPartialCurrentUserGuild,
    type RESTPostOAuth2AccessTokenResult,
} from "discord-api-types/v10";

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

export const callbackHandler: RequestHandler = async ({ url, fetch, cookies }) => {
  const code = url.searchParams.get("code");

  if (!code || url.searchParams.get("state") !== cookies.get("discord-oauth2-state")) {
    return redirect(303, "/");
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

  cacheUser(userData.id, {
    id: userData.id,
    username: userData.username,
    displayName: userData.global_name || userData.username,
    avatar: userData.avatar,
  });

  const session = createSessionToken(userData.id, oauthResJson.access_token);

  cookies.set("session", session, {
    path: "/",
    maxAge: oauthResJson.expires_in,
  });

  redirect(302, redirectUrl || "/");
};

export const logoutHandler: RequestHandler = async ({ cookies, fetch }) => {
  // Revoke token, remove it from cache
  // Clear cookie
  // Redirect to home page

  const seToken = cookies.get("session");
  if (!seToken) return redirect(302, "/");

  cookies.delete("session", { path: "/" });

  const sessionData = verifySessionToken(seToken);
  if (!sessionData) return redirect(302, "/");

  const aToken = getToken(seToken);
  if (!aToken) return redirect(302, "/");

  try {
    await fetch(OAuth2Routes.tokenRevocationURL, {
      method: "POST",
      body: new URLSearchParams({
        client_id: discord.clientId,
        client_secret: discord.clientSecret,
        token_type_hint: "access_token",
        token: aToken,
      }).toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  } catch (error) {
    console.error("Token Revocation Error:", error);
  }

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
export async function fetchUserData(userId: string, fetch: Function, useCache = true): Promise<BasicUser> {
  const userData = getUser(userId);
  if (useCache && userData) return userData;

  const token = getToken(userId);
  if (!token) throw { status: 401, message: "Unauthorized" };

  const userRes = await fetch(RouteBases.api + Routes.user(), {
    method: "GET",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
  });

  if (!userRes.ok) {
    throw userRes;
  }

  const userResJson = (await userRes.json()) as APIUser;
  return {
    id: userResJson.id,
    username: userResJson.username,
    displayName: userResJson.global_name || userResJson.username,
    avatar: userResJson.avatar,
  };
}

interface FetchUserGuildsOptions {
  /**
   * Whether to bypass the cache and fetch fresh data from the API. Defaults to `false`.
   */
  bypassCache?: boolean;
}

/**
 * Fetches the guilds that the current user guilds from the Cache or Discord API.#
 *
 * **Note: Don't forget up update the cache afterwards!**
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
): Promise<DCGuild[]> {
  options = Object.assign({ bypassCache: false, overwriteCache: true }, options);
  if (!options.bypassCache) {
    const cachedGuilds = getUserGuilds(userId);
    if (cachedGuilds) {
      return cachedGuilds;
    }
  }

  const guildRes = await fetch(RouteBases.api + Routes.userGuilds(), {
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
  const guilds = guildResJson.map((guild) => parseToCacheGuild(guild));
  return guilds;
}
