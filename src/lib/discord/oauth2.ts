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
import { redirect, type Cookies, type RequestHandler } from "@sveltejs/kit";
import {
  OAuth2Routes,
  RouteBases,
  Routes,
  type APIUser,
  type RESTPostOAuth2AccessTokenResult,
  type RESTPostOAuth2RefreshTokenResult,
} from "discord-api-types/v10";
import ky from "ky";
import { fetchUserData } from "./utils";

type OAuth2LoginOpts = {
  url: URL;
  prompt?: "true" | "none";
  joinDiscord: boolean;
};

export const createOAuth2Login = function (opts: OAuth2LoginOpts) {
  // TODO: Add redirect logic
  // const redirectUrl = opts.url.searchParams.get("redirect") || null;
  const state = crypto.randomUUID();

  let scopes = discord.baseScopes.join(" ");
  if (opts.joinDiscord) {
    scopes += " guilds.join";
  }

  return {
    url: urls.authorize({
      clientId: env.clientId,
      scope: scopes,
      state: state,
      prompt: opts.prompt ?? "true",
      redirectUri: discord.redirectUri,
    }),
    state: state,
  };
};

/**
 * Exchanges a code or refresh token for OAuth2 tokens
 */
async function exchangeToken(
  params: Record<string, string>,
): Promise<RESTPostOAuth2AccessTokenResult | RESTPostOAuth2RefreshTokenResult> {
  const response = await ky.post(urls.token(), {
    body: new URLSearchParams(params).toString(), // Send params in the body, not as searchParams
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    console.error("Token exchange failed:", response);
    throw new Error(`Token exchange failed: (${response.status})`);
  }

  return await response.json();
}

/**
 * Adds a user to the support Discord server if they have the guilds.join scope
 */
async function addUserToSupportServer(accessToken: string, userId: string): Promise<void> {
  console.log("🤘🏻 Adding user to support server:", accessToken, userId, discord.supportServerId);
  if (!discord.supportServerId) return;

  try {
    const joinRes = await ky.put(`${RouteBases.api}${Routes.guildMember(discord.supportServerId, userId)}`, {
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${env.botToken}`,
      },
      json: {
        access_token: accessToken,
      },
    });

    if (!joinRes.ok) {
      throw new Error(`Failed to add user to guild: ${await joinRes.text()} (${joinRes.status})`);
    }
  } catch (joinErr) {
    // Log the error but continue with the authentication process
    console.error("Error adding user to guild:", joinErr);
  }
}

/**
 * Sets up user session after authentication
 */
function setupUserSession(
  cookies: Cookies,
  userId: string,
  tokenData: RESTPostOAuth2AccessTokenResult | RESTPostOAuth2RefreshTokenResult,
  stayLoggedIn = false,
): void {
  const session = createSessionToken(userId, stayLoggedIn);
  cookies.set("session", session, {
    path: "/",
    maxAge: tokenData.expires_in,
  });
}

/**
 * Logic:
 * - Check if the state is valid
 * - Exchange the code for an access token
 * - Fetch user data
 * - Create a session token
 * - Set the session cookie
 * - Redirect to server select page
 */
export const callbackHandler: RequestHandler = async ({ url, cookies, locals }) => {
  const code = url.searchParams.get("code");

  if (!code || url.searchParams.get("state") !== cookies.get("discord-oauth2-state")) {
    redirect(303, `/login?error=${encodeURIComponent("Invalid state or code. Please try again.")}`);
  }

  cookies.delete("discord-oauth2-state", { path: "/" });

  const joinDiscord = cookies.get("join-discord") === "true";
  let scopes = discord.baseScopes.join(" ");
  if (joinDiscord) {
    scopes += " guilds.join";
  }

  const tokenParams = {
    client_id: discord.clientId,
    client_secret: discord.clientSecret,
    grant_type: "authorization_code",
    redirect_uri: discord.redirectUri,
    code: String(code),
    scope: scopes,
  };
  console.log("Token Params:", tokenParams);

  let tokenData: RESTPostOAuth2AccessTokenResult;
  try {
    tokenData = (await exchangeToken(tokenParams)) as RESTPostOAuth2AccessTokenResult;
  } catch (err: any) {
    console.error("Failed during OAuth2 callback token exchange:", err);
    // Redirect to login page with error parameter
    redirect(303, `/login?error=${encodeURIComponent("Token exchange failed. Please try again.")}`);
  }

  let userData: APIUser;
  try {
    userData = await fetchUserData(tokenData.access_token, null, false);
  } catch (err) {
    console.error("Failed to fetch user data during callback:", err);
    redirect(303, `/login?error=${encodeURIComponent("Could not retrieve your user information. Please try again.")}`);
  }

  // Check if the user has the guilds.join scope
  if (tokenData.scope.includes("guilds.join")) {
    await addUserToSupportServer(tokenData.access_token, userData.id);
  }

  try {
    cacheDiscordUser(userData);
    await updateUser(
      userData.id,
      {
        tokens: encodeDbTokens(tokenData),
      },
      true,
    );
  } catch (err) {
    console.error("Failed to update user data:", err);
    // Continue with authentication even if caching/DB update fails
  }

  setupUserSession(cookies, userData.id, tokenData, locals.stayLoggedIn);
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
  if (!token) redirect(302, "/login");

  cookies.delete("session", { path: "/" });

  try {
    await ky.post(OAuth2Routes.tokenRevocationURL, {
      searchParams: {
        client_id: discord.clientId,
        client_secret: discord.clientSecret,
        token_type_hint: "access_token",
        token: token,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  } catch (error) {
    console.error("Token Revocation Error:", error);
  }

  if (locals.userId) {
    await updateUser(locals.userId, {
      tokens: null,
    });
  }

  redirect(302, "/login");
};

/**
 * Logic:
 * - Check if the user is logged in
 * - Check if the refresh token is valid
 * - Exchange the refresh token for a new access token
 * - Update the user in the database
 * - Set the session cookie
 * - Redirect to the original page
 * - If the refresh token is invalid, redirect to the login page
 */
export const refreshTokenHandler: RequestHandler = async ({ locals, url, cookies }) => {
  // User is automatically redirected to this endpoint when the token is expired
  const userId = locals.userId;
  const refreshToken = locals.refreshToken;
  if (!userId || !refreshToken) redirect(302, "/login");

  const redirectPath: string = url.searchParams.has("redirect")
    ? decodeURIComponent(url.searchParams.get("redirect")!)
    : "/";

  // Refresh the token
  const tokenParams = {
    client_id: discord.clientId,
    client_secret: discord.clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  };

  let tokenData: RESTPostOAuth2RefreshTokenResult;
  try {
    tokenData = (await exchangeToken(tokenParams)) as RESTPostOAuth2RefreshTokenResult;
  } catch (err) {
    console.error("Failed to refresh OAuth2 token:", err);

    // Clear the invalid session
    cookies.delete("session", { path: "/" });

    // Redirect to login page with error and the original redirect path
    redirect(
      302,
      `/login?error=${encodeURIComponent("Your session has expired. Please log in again.")}&redirect=${encodeURIComponent(redirectPath)}`,
    );
  }

  try {
    // Update the user in the database
    await updateUser(
      userId,
      {
        tokens: encodeDbTokens(tokenData),
      },
      true,
    );
  } catch (err) {
    console.error("Failed to update user tokens in database:", err);
    // Continue even if database update fails
  }

  // Update the session
  setupUserSession(cookies, userId, tokenData, !!locals.stayLoggedIn);
  redirect(302, redirectPath);
};
