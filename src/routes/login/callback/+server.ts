import { redirectToLoginWithError } from "$lib";
import { SessionManager } from "$lib/server/auth";
import { discord } from "$lib/server/constants";
import { BlacklistEntry, updateDBUser } from "$lib/server/db/index.js";
import { DiscordUserAPI } from "$lib/server/discord";
import { BlacklistScope, EntityType, UserRole } from "$lib/sm-types/src/index.js";
import { discordUrls } from "$lib/urls";
import * as Sentry from "@sentry/sveltekit";
import { redirect } from "@sveltejs/kit";
import type { RESTPostOAuth2AccessTokenResult } from "discord.js";

export async function GET({ url, cookies }) {
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const urlState = url.searchParams.get("state");
  const cookieState = cookies.get("oauth_state");

  if (error || !code) {
    return redirectToLoginWithError({
      errKey: "invalid_session",
    });
  }

  const guildId = url.searchParams.get("guild_id");
  if (guildId) {
    // Implicit code grant: Check if guild is blacklisted
    const isBlacklisted = await BlacklistEntry.exists({
      guildId: guildId,
      _type: EntityType.guild,
      scopes: { $bitsAllSet: BlacklistScope.global },
    });
    if (isBlacklisted) {
      Sentry.logger.info("Blocked OAuth attempt from blacklisted guild", {
        extra: {
          guildId,
        },
      });
      return redirect(302, "This server is banned from using the bot.");
    }
  }

  if (!urlState || !cookieState) {
    return redirectToLoginWithError({
      errKey: "invalid_session",
    });
  } else if (urlState !== cookieState) {
    return redirectToLoginWithError({
      errKey: "invalid_session",
    });
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
        client_id: discord.clientId!,
        client_secret: discord.clientSecret!,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: discord.redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return new Response(null, {
        headers: { Location: `/login?error=error4xx&error_description=${encodeURIComponent(errorText)}` },
      });
    }
    tokenData = (await tokenResponse.json()) as RESTPostOAuth2AccessTokenResult;
  } catch (err: any) {
    Sentry.captureException(err, { mechanism: { handled: true } });
    return redirectToLoginWithError({
      errKey: "token_exchange_failed",
    });
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
    return redirectToLoginWithError({
      errKey: "user_fetch_failed",
      description: errMsg,
    });
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
  cookies.set("session_id", sessionToken, {
    path: "/",
    sameSite: "lax",
    maxAge: expires_in,
  });
  cookies.set("was_logged_in", "1", {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  // Redirect to dashboard
  redirect(302, "/");
}
