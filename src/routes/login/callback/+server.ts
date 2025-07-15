import { redirectToLoginWithError } from "$lib";
import { SessionManager } from "$lib/server/auth";
import { discord } from "$lib/server/constants";
import { DiscordUserAPI } from "$lib/server/discord";
import { discordUrls } from "$lib/urls";
import * as Sentry from "@sentry/node";
import { redirect } from "@sveltejs/kit";
import type { RESTPostOAuth2AccessTokenResult } from "discord.js";

export async function GET({ url, cookies }) {
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const urlState = url.searchParams.get("state");
  const cookieState = cookies.get("oauth_state");
  const stayLoggedIn = cookies.get("keep-refresh-token");

  if (error || !code) {
    return redirectToLoginWithError(error || "Missing authorization code. Try again from here...");
  }

  if (!urlState || !cookieState) {
    return redirectToLoginWithError("Missing state. Try again.");
  } else if (urlState !== cookieState) {
    return redirectToLoginWithError("State parameter invalid. Try again.");
  }

  cookies.delete("state", { path: "/" });

  let tokenData: RESTPostOAuth2AccessTokenResult;
  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch(discordUrls.token(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: discord.clientId,
        client_secret: discord.clientSecret,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: discord.redirectUri(url.origin),
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return redirectToLoginWithError(`Token Exchange Failed: ${errorText}`);
    }
    tokenData = (await tokenResponse.json()) as RESTPostOAuth2AccessTokenResult;
  } catch (err: any) {
    Sentry.captureException(err, { mechanism: { handled: true } });
    return redirectToLoginWithError("Token Exchange Failed");
  }

  const { access_token, refresh_token, expires_in } = tokenData as RESTPostOAuth2AccessTokenResult;

  // Fetch user information from Discord API
  const userRes = await new DiscordUserAPI(access_token).getCurrentUser();

  if (userRes.hasAnyError()) {
    let errMsg = userRes.error.toString();
    if (userRes.hasDiscordAPIError()) {
      errMsg = `DiscordAPIError: ${userRes.error.message}`;
    } else if (userRes.hasHTTPError()) {
      errMsg = `HTTPError: ${userRes.error.message}`;
    }
    Sentry.captureException(userRes.error, { mechanism: { handled: true, source: "DiscordUserAPI" } });
    return redirectToLoginWithError(errMsg);
  }

  const user = userRes.data!;

  // Create JWT session cookie
  const sessionToken = await SessionManager.createSession({
    tokens: {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
    },
    userId: user.id,
  });

  // Set session cookie
  cookies.set("session", sessionToken, {
    path: "/",
    sameSite: "lax",
    maxAge: expires_in,
  });

  // Redirect to dashboard
  redirect(302, "/");
}
