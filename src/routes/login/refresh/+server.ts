import { redirectToLoginWithError } from "$lib/index.js";
import { SessionManager } from "$lib/server/auth.js";
import { discord } from "$lib/server/constants";
import { DiscordUserAPI } from "$lib/server/discord.js";
import { discordUrls } from "$lib/urls";
import * as Sentry from "@sentry/sveltekit";
import { redirect } from "@sveltejs/kit";
import type { RESTPostOAuth2AccessTokenResult } from "discord-api-types/v10";

export async function GET({ locals, cookies }) {
  if (!locals.token || !locals.token.refreshToken) {
    return redirectToLoginWithError("No token found. Please log in again.", 401);
  } else if (!locals.token.userId) {
    cookies.delete("session", { path: "/" });
    return redirectToLoginWithError("No user found. Please log in again.", 401);
  } else if (locals.token.expiresAt < new Date()) {
    cookies.delete("session", { path: "/" });
    return redirectToLoginWithError("Token expired. Please log in again.", 401);
  }

  const res = await fetch(discordUrls.token(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: discord.clientId,
      client_secret: discord.clientSecret,
      grant_type: "refresh_token",
      refresh_token: locals.token.refreshToken,
      scope: "identify guilds guilds.members.read",
    }).toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    Sentry.captureMessage(errorText, {
      extra: {
        userId: locals.token.userId,
        status: res.status,
        response: res,
      },
    });
    return redirectToLoginWithError("Failed to refresh token. Please log in again.", 500);
  }

  const tokenData = await res.json();

  const { access_token, refresh_token, expires_in } = tokenData as RESTPostOAuth2AccessTokenResult;

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
  try {
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
  } catch (err: any) {
    Sentry.captureException(err, { mechanism: { handled: true, source: "SessionManager" } });
    return redirectToLoginWithError("Failed to create session. Please log in again.");
  }

  // Redirect to dashboard
  redirect(302, "/");
}
