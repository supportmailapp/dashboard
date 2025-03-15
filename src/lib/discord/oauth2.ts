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
import { getMember } from "$lib/cache/members";
import { cacheUser, getToken, getUser } from "$lib/cache/users";
import { urls } from "$lib/constants";
import { createSessionToken, verifySessionToken } from "$lib/server/auth";
import { discord } from "$lib/server/constants";
import { anyUserToBasic } from "$lib/utils/formatting";
import { error, redirect, type RequestHandler } from "@sveltejs/kit";
import {
  OAuth2Routes,
  RouteBases,
  Routes,
  type APIUser,
  type RESTAPIPartialCurrentUserGuild,
  type RESTPostOAuth2AccessTokenResult,
  type RESTGetCurrentUserGuildMemberResult as OAuth2GuildMember,
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

  redirect(303, "/");
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
 * @throws {Response} Will throw an error if the API request fails. Format: `{ status: number, message: string }`
 */
export async function fetchUserData(userId: string, useCache = true): Promise<BasicUser> {
  const userData = getUser(userId);
  if (useCache && userData) return userData;

  const token = getToken(userId);
  if (!token) throw new Response("Unauthorized", { status: 401, statusText: "Unauthorized" });

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
  return anyUserToBasic(userResJson);
}

interface FetchUserGuildsOptions {
  /**
   * Whether to bypass the cache and fetch fresh data from the API. Defaults to `false`.
   */
  bypassCache?: boolean;
  /**
   * Whether to return full guild objects instead of cacheable guild objects. Defaults to `false`.
   */
  fullGuilds?: boolean;
}

/**
 * Fetches the guilds that the current user guilds from the Discord API.
 *
 * **Note: Don't forget up update the cache afterwards!**
 *
 * @param userId - The ID of the user whose guilds are to be fetched.
 * @param accessToken - The access token for authenticating the request.
 * @param fetch - The fetch function to make the HTTP request.
 * @param options - Options for fetching user guilds.
 * @returns A promise that resolves to an array of partial guild objects.
 * @throws {Response} An error object containing the status and message if the request fails.
 */
export async function fetchUserGuilds(
  userId: string,
  accessToken: string,
  options: FetchUserGuildsOptions & { fullGuilds: true },
): Promise<RESTAPIPartialCurrentUserGuild[]>;

/**
 * Fetches the guilds that the current user guilds from the Cache or Discord API.
 *
 * **Note: Don't forget up update the cache afterwards!**
 *
 * @param userId - The ID of the user whose guilds are to be fetched.
 * @param accessToken - The access token for authenticating the request.
 * @param fetch - The fetch function to make the HTTP request.
 * @param options - Options for fetching user guilds.
 * @returns A promise that resolves to an array of partial guild objects.
 * @throws {Response} An error object containing the status and message if the request fails.
 */
export async function fetchUserGuilds(
  userId: string,
  accessToken: string,
  options?: FetchUserGuildsOptions,
): Promise<CachableGuild[]>;

export async function fetchUserGuilds(userId: string, accessToken: string, options: FetchUserGuildsOptions = {}) {
  options = Object.assign({ bypassCache: false, fullGuilds: false }, options);
  if (!options.bypassCache && !options.fullGuilds) {
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
  if (options.fullGuilds) return guildResJson;
  const guilds = guildResJson.map((guild) => parseToCacheGuild(guild));
  return guilds;
}

/**
 * Fetches a guild member's data from the Discord API.
 *
 * This function first attempts to retrieve the guild member's data from a cache.
 * If the data is not found in the cache, it makes an API request to fetch the data.
 *
 * @param guildId - The ID of the guild.
 * @param userId - The ID of the user.
 * @param accessToken - The access token for authorization.
 * @returns A promise that resolves to the guild member's data.
 * @throws {Response} Will throw an error if the fetch operation fails.
 */
export async function fetchGuildMember(guildId: string, userId: string, accessToken: string): Promise<OAuth2GuildMember> {
  const cachedMember = getMember(guildId, userId);
  if (cachedMember) return cachedMember;

  const memberRes = await fetch(RouteBases.api + Routes.guildMember(guildId, userId), {
    method: "GET",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!memberRes.ok) {
    if (memberRes.status != 429) console.error("Failed to fetch guild member data:", memberRes);
    throw memberRes;
  }

  const memberResJson = (await memberRes.json()) as OAuth2GuildMember;
  return memberResJson;
}
