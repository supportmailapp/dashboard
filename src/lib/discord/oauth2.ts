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
import { urls } from "$lib/constants";
import { decodeToken, encodeToken } from "$lib/server/auth";
import { discord } from "$lib/server/constants";
import { REST } from "@discordjs/rest";
import { error, json, redirect, type RequestHandler } from "@sveltejs/kit";
import {
  OAuth2Routes,
  Routes,
  type APIGuildMember,
  type APIPartialGuild,
  type APIUser,
  type RESTPostOAuth2AccessTokenResult,
} from "discord-api-types/v10";
import NodeCache from "node-cache";
import type { PageServerLoad } from "../../routes/$types";

const rest = new REST({ version: "v10", authPrefix: "Bearer", userAgentAppendix: "SupportMailV2" });

let stateCache = new NodeCache({ stdTTL: 600, checkperiod: 10, errorOnMissing: false });

export const loginHandler = function (url: URL) {
  const redirectParam = url.searchParams.get("redirect");
  const redirectUrl = redirectParam ? decodeURI(redirectParam) : "/";
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  stateCache.set(state, redirectUrl);
  return {
    status: 302,
    url: urls.authorize({
      clientId: env.clientId,
      scope: discord.scopes.join(" "),
      state: state,
      promt: "none",
    }),
  };
};

export const callbackHandler: RequestHandler = async ({ url, fetch, cookies }) => {
  // Verify state token, take it from cache
  // Exchange code for token
  // Store token in cache, set cookie
  // Redirect to server-select page or redirect url

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return error(405, 'A "code" query parameter must be present in the URL.');
  }

  const redirectUrl = stateCache.take(String(state)) as string;

  if (!redirectUrl) {
    return redirect(400, "/login");
  }

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
    userData = await getUserData(oauthResJson.access_token, fetch);
  } catch (err: any) {
    console.error(err);
    return error(500, {
      message: err?.message,
    });
  }

  const eToken = encodeToken({
    access_token: oauthResJson.access_token,
    refresh_token: oauthResJson.refresh_token,
    expires_at: new Date(Date.now() + oauthResJson.expires_in * 1000).toISOString(),
    userId: userData.id,
  });

  cookies.set("discord-token", eToken, {
    path: "/",
    // maxAge: oauthResJson.expires_in, // ? Is this necessary? Maybe set maxAge to 14d for refresh token support (within 14 days)
    // secure: true, // ! Uncomment for production #f00
    sameSite: "strict",
    httpOnly: true,
  });

  redirect(302, redirectUrl);
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
  // Get refresh token from cookies
  // Exchange refresh token for new token
  // Set cookie with new token

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
    userData = await getUserData(oauthResJson.access_token, fetch); // Bypass cache
  } catch (err: any) {
    console.error(err);
    throw { status: 500, message: "Failed to fetch user data", hint: "login" };
  }

  const eToken = encodeToken({
    access_token: oauthResJson.access_token,
    refresh_token: oauthResJson.refresh_token,
    expires_at: new Date(Date.now() + oauthResJson.expires_in * 1000).toISOString(),
    userId: userData.id,
  });

  return eToken;
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

// User data cache
let userDataCache = new NodeCache({ stdTTL: 15, checkperiod: 10, errorOnMissing: false });

/**
 * Fetches user data from the Discord API using the provided access token.
 * If a user ID is provided, it first attempts to retrieve the user data from the cache.
 * If the data is not found in the cache, it fetches the data from the API and caches it for future use.
 *
 * @returns A promise that resolves to the user data.
 * @throws Will throw an error if the API request fails. Format: `{ status: number, message: string }`
 */
export async function getUserData(accessToken: string, fetch: Function, userId: string | null = null): Promise<APIUser> {
  // Get user data from cache; if undefined then from API
  // Set user data in cache for 15 seconds
  // Return user data

  if (userId) {
    const cachedData = userDataCache.get(userId) as APIUser;
    if (cachedData) {
      return cachedData;
    }
  }

  let userRes: Response;
  try {
    userRes = await fetch(Routes.user(), {
      method: "GET",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userRes.ok) {
      throw { status: 500, message: "Failed to fetch user data" };
    }
  } catch (err) {
    console.error("Error fetching user data:", err);
    throw { status: 500, message: "Failed to fetch user data" };
  }

  const userResJson = (await userRes.json()) as APIUser;
  userDataCache.set(userResJson.id, userResJson);
  return userResJson;
}

// User guilds cache
let userGuildsCache = new NodeCache({ stdTTL: 15, checkperiod: 10, errorOnMissing: false });

/**
 * Fetches the guilds that the user is a member of from the Discord API.
 *
 * @param userId - The ID of the user whose guilds are being fetched.
 * @param accessToken - The OAuth2 access token for the user.
 * @param fetch - The fetch function to use for making the API request.
 * @param bypassCache - Whether to bypass the cache and fetch fresh data from the API. Defaults to false.
 * @returns A promise that resolves to an array of partial guild objects.
 * @throws An error if the fetch operation fails.
 */
export async function getUserGuilds(
  userId: string,
  accessToken: string,
  fetch: Function,
  bypassCache = false,
): Promise<APIPartialGuild[]> {
  if (!bypassCache) {
    const cachedGuilds = userGuildsCache.get(accessToken) as APIPartialGuild[];
    if (cachedGuilds) {
      return cachedGuilds;
    }
  }

  let guildRes: Response;
  try {
    guildRes = await fetch(Routes.userGuilds(), {
      method: "GET",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!guildRes.ok) {
      throw { status: 500, message: "Failed to fetch user guilds" };
    }
  } catch (err: any) {
    console.debug("Error fetching user guilds:", err);
    throw { status: 500, message: err.message || "Failed to fetch user guilds" };
  }

  const guildResJson = (await guildRes.json()) as APIPartialGuild[];
  userGuildsCache.set(userId, guildResJson);
  return guildResJson;
}

// Guild member data cache
let guildMemberDataCache = new NodeCache({ stdTTL: 15, checkperiod: 10, errorOnMissing: false });

/**
 * Fetches guild member data from the Discord API and caches it.
 *
 * @param guildId - The ID of the guild.
 * @param userId - The ID of the user.
 * @param accessToken - The access token for authentication.
 * @param fetch - The fetch function to make the API request.
 * @param bypassCache - Whether to bypass the cache and fetch fresh data. Defaults to false.
 * @returns A promise that resolves to the guild member data or null if not found.
 * @throws An error if the fetch operation fails. Format: `{ status: number, message: string }`
 */
export async function getGuildMemberData(
  guildId: string,
  userId: string,
  accessToken: string,
  fetch: Function,
  bypassCache = false,
): Promise<APIGuildMember | null> {
  if (!bypassCache) {
    const cachedData = guildMemberDataCache.get(`${guildId}-${userId}`) as APIGuildMember;
    if (cachedData) {
      return cachedData;
    }
  }

  let memberRes: Response;
  try {
    memberRes = await fetch(Routes.userGuildMember(guildId), {
      method: "GET",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!memberRes.ok) {
      throw { status: 500, message: "Failed to fetch user member data" };
    }
  } catch (err: any) {
    console.debug("Error fetching user member data:", err);
    throw { status: 500, message: err.message || "Failed to fetch user member data" };
  }

  const memberResJson = (await memberRes.json()) as APIGuildMember;
  guildMemberDataCache.set(`${guildId}-${userId}`, memberResJson);
  return memberResJson;
}
