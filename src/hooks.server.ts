import { env } from "$env/dynamic/private";
import { JsonErrors } from "$lib/constants.js";
import { checkUserGuildAccess, SessionManager } from "$lib/server/auth";
import { dbConnect } from "$lib/server/db";
import { DiscordBotAPI, DiscordUserAPI } from "$lib/server/discord";
import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/sveltekit";
import * as Sentry from "@sentry/node";
import { type Handle, type HandleServerError } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import dayjs from "dayjs";
import { inspect } from "util";
import wildcardMatch from "wildcard-match";

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
      allow: [],
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
    // Get session token from cookie or Authorization header
    const cookieToken = event.cookies.get("session");
    const authHeader = event.request.headers.get("Authorization");
    const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    const sessionToken = cookieToken || headerToken;
    if (!sessionToken) {
      return { user: null, token: null, error: "notfound" };
    }

    try {
      // Find session in database
      const tokenResult = await SessionManager.getUserTokenBySession(sessionToken);

      if (tokenResult.isExpired()) {
        return { error: "expired", token: tokenResult.token, user: null };
      } else if (!tokenResult.isFound()) {
        return { user: null, token: null, error: "notfound" };
      }

      const { token } = tokenResult;

      // Find user by session's userId
      const userRes = await new DiscordUserAPI(token.accessToken).getCurrentUser();
      if (!userRes.isSuccess()) {
        return { user: null, token: null, error: "other" };
      }

      return { user: userRes.data, token: tokenResult.token };
    } catch (error) {
      console.error("Session validation error:", error);
      return { user: null, token: null, error: "other" };
    }
  };

  event.locals.isAuthenticated = () => Boolean(event.locals.user && event.locals.token);

  return resolve(event);
};

const mainAuthGuard: Handle = async ({ event, resolve }) => {
  const sessionData = await event.locals.getSafeSession();
  console.debug("Session data:", sessionData);
  event.locals.user = sessionData.user;
  event.locals.token = sessionData.token;

  return resolve(event);
};

type APIRouteConfig = {
  /**
   * Whether the route allows unauthenticated access.
   */
  allowUnauthenticated?: boolean;
  /**
   * Optional list of HTTP methods that the route supports.
   *
   * If not specified, the route applies to all methods.
   */
  methods?: string[];
};

const UNAUTHENTICATED_ROUTES: Record<string, APIRouteConfig> = {
  "/api/*/testing": { allowUnauthenticated: true },
};

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

/**
 * The general API Auth Guard.
 *
 * @see {@link Handle}
 */
const apiAuthGuard: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;

  if (!pathname.startsWith("/api/")) {
    return resolve(event); // Skip auth guard for non-API routes
  }

  // Check if route is in the unauthenticated list
  for (const [pattern, config] of Object.entries(UNAUTHENTICATED_ROUTES)) {
    if (matchesRoute(pattern, pathname)) {
      if (config.allowUnauthenticated) {
        return resolve(event); // Allow unauthenticated access
      }
      break;
    }
  }

  // Default: require authentication for all API routes not in the unauthenticated list
  if (!event.locals.isAuthenticated()) {
    return JsonErrors.unauthorized("Authentication required");
  }

  return resolve(event);
};

const GUILD_API_ROUTES = ["/api/*/configs/**", "/api/*/guilds/**", "/g/**"];

/**
 * The Auth Guard for guild-specific routes.
 *
 * @see {@link Handle}
 */
const guildAuthGuard: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;
  const guildId = event.params.guildid;

  if ((!pathname.startsWith("/api/") && !pathname.startsWith("/g")) || !guildId) {
    return resolve(event); // Skip auth guard for some paths that definitly have no guild param
  }

  event.locals.guildId = guildId;

  // Just a typeguard
  if (!event.locals.token || !event.locals.user) {
    return JsonErrors.unauthorized();
  }

  const userRest = new DiscordUserAPI(event.locals.token.accessToken);

  for (const apiWildcard of GUILD_API_ROUTES) {
    if (matchesRoute(apiWildcard, pathname)) {
      const accessResult = await checkUserGuildAccess(event.locals.user.id, guildId, userRest);
      switch (accessResult) {
        case 200:
          break;
        case 403:
          return JsonErrors.forbidden();
        case 404:
          return JsonErrors.notFound();
        default:
          return JsonErrors.serverError();
      }

      break;
    }
  }

  event.locals.discordUserRest = userRest;

  return resolve(event);
};

export const handle = sequence(
  devToolsCheck,
  authHandler,
  mainAuthGuard,
  apiRateLimitCheck,
  apiAuthGuard,
  guildAuthGuard,
);

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
    id: errorId,
  };
};
