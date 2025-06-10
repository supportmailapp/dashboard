import { env } from "$env/dynamic/private";
import { JsonErrors } from "$lib/constants.js";
import { dbConnect, DBUser } from "$lib/server/db";
import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/sveltekit";
import * as Sentry from "@sentry/node";
import { redirect, type Handle, type HandleServerError } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import dayjs from "dayjs";
import { Session } from "supportmail-types";
import { inspect } from "util";
import wildcardMatch from "wildcard-match";
import jwt from "jsonwebtoken";
import { DiscordBotAPI, DiscordUserAPI } from "$lib/server/discord";
import { sessionManager } from "$lib/server/auth";

const inDevMode = env.NODE_ENV === "development";

export async function init() {
  await dbConnect();
  console.log("Environment:", env.NODE_ENV);
  console.log("Server started at", dayjs().toString());
}

// 100 requests per minute for all routes (Live)
const aj = arcjet({
  key: env.ARCJET_KEY!,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: env.ARCJET_MODE! as any }),
    detectBot({
      mode: env.ARCJET_MODE! as any,
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    slidingWindow({
      mode: env.ARCJET_MODE! as any,
      interval: inDevMode ? 60000 : 60,
      max: inDevMode ? 8000 : 100,
    }),
  ],
});

const devToolsCheck: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/.well-known/appspecific/com.chrome.devtools")) {
    console.debug("Serving empty DevTools response");
    return new Response(null, { status: 204 }); // Return empty response with 204 No Content
  }
  return resolve(event);
};

const apiRateLimitCheck: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/api")) {
    const rateLimit = await aj.protect(event);

    if (rateLimit.isDenied()) {
      if (rateLimit.reason.isRateLimit()) {
        return JsonErrors.tooManyRequests();
      } else if (rateLimit.reason.isBot()) {
        return JsonErrors.forbidden("Bot access is not allowed");
      } else {
        return JsonErrors.serverError("Rate limit check failed");
      }
    }
  }

  return resolve(event);
};

const authHandler: Handle = async ({ event, resolve }) => {
  event.locals.discordRest = new DiscordBotAPI();

  event.locals.getSafeSession = async () => {
    // Get session token from cookie
    const sessionToken = event.cookies.get("session_token");
    if (!sessionToken) {
      return { session: null, user: null };
    }

    try {
      // Find session in database
      const sessionData = await sessionManager.getSessionById(sessionToken, true);

      if (!sessionManager.hasSession(sessionData) || !sessionManager.hasTokens(sessionData)) {
        // Clean up expired cookie
        event.cookies.delete("session_token", { path: "/" });
        return { session: null, user: null };
      }

      const { session, tokens } = sessionData;

      // Find user by session's userId
      const user = await new DiscordUserAPI(tokens.accessToken).getCurrentUser();
      if (!user) {
        // Clean up orphaned session
        await Session.deleteOne({ _id: session._id });
        event.cookies.delete("session_token", { path: "/" });
        return { session: null, user: null };
      }

      // Validate JWT tokens if present
      if (tokens) {
        try {
          const decoded = jwt.verify(user.tokens, env.JWT_SECRET) as { at: string; rt: string };
          // Token is valid, continue
        } catch (jwtError: any) {
          // JWT validation failed - clean up
          await Session.deleteOne({ _id: sessionData._id });
          event.cookies.delete("session_token", { path: "/" });
          return { session: null, user: null };
        }
      }

      // Update session last activity
      await Session.updateOne({ _id: sessionData._id }, { lastActivity: new Date() });

      return { user, session: sessionData };
    } catch (error) {
      console.error("Session validation error:", error);
      return { session: null, user: null };
    }
  };

  event.locals.isAuthenticated = () => Boolean(event.locals.user && event.locals.session);

  return resolve(event);
};

type APIRouteConfig = {
  /**
   * Whether the route requires authentication.
   */
  authRequired?: boolean;
  /**
   * Optional list of HTTP methods that the route supports.
   *
   * If not specified, the route applies to all methods.
   */
  methods?: string[];
};

const AUTHED_ROUTES: Record<string, APIRouteConfig> = {};

function matchesRoute(pattern: string, pathname: string): boolean {
  if (!pattern.includes("*")) {
    const exactMatch = pathname === pattern;
    return exactMatch;
  }

  const isMatch = wildcardMatch(pattern, {
    flags: "i",
  });

  const wildcardResult = isMatch(pathname);
  return wildcardResult;
}

const apiAuthGuard: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;

  if (!pathname.startsWith("/api/")) {
    return resolve(event); // Skip auth guard for non-API routes
  }

  for (const [pattern, config] of Object.entries(AUTHED_ROUTES)) {
    if (matchesRoute(pattern, pathname)) {
      if (config.authRequired && !(event.locals.user && event.locals.session)) {
        return JsonErrors.unauthorized("Authentication required");
      }

      break;
    }
  }

  return resolve(event);
};

export const handle = sequence(devToolsCheck, apiRateLimitCheck, apiAuthGuard);

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
  const errorId =
    env.NODE_ENV != "development"
      ? Sentry.captureException(error, {
          extra: { event, status },
        })
      : crypto.randomUUID();

  console.error(event.url.toString(), inspect(error));

  return {
    message: message || "Internal server error",
    errorId: errorId,
  };
};
