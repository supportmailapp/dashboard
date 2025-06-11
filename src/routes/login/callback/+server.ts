import { urls } from "$lib/constants";
import { SessionManager } from "$lib/server/auth";
import { discord } from "$lib/server/constants";
import { DiscordUserAPI } from "$lib/server/discord";
import { redirect } from "$lib";
import { redirect as svRedirect } from "@sveltejs/kit";
import type { RESTPostOAuth2AccessTokenResult } from "discord.js";
import * as Sentry from "@sentry/node";

function redirectWithError(errStr: string) {
  return redirect(302, "/login?error=" + encodeURIComponent(errStr));
}

export async function GET({ url, cookies }) {
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return redirectWithError(error || "Missing authorization code. Try again from here...");
  }

  let tokenData: RESTPostOAuth2AccessTokenResult;
  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch(urls.discord.tokenExchange(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: discord.clientId,
        client_secret: discord.clientSecret,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: discord.redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }
    tokenData = (await tokenResponse.json()) as RESTPostOAuth2AccessTokenResult;
  } catch (err: any) {
    Sentry.captureException(err, { mechanism: { handled: true } });
    return redirectWithError("Token Exchange Failed");
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
    return redirectWithError(errMsg);
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
  svRedirect(302, "/");
}
