import { dev } from "$app/environment";
import { env } from "$env/dynamic/private";
import { PUBLIC_SENTRY_DSN } from "$env/static/public";
import { JsonErrors } from "$lib/constants.js";
import { checkUserGuildAccess, SessionManager } from "$lib/server/auth";
import { dbConnect } from "$lib/server/db";
import { DiscordBotAPI, DiscordUserAPI } from "$lib/server/discord";
import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/sveltekit";
import * as Sentry from "@sentry/sveltekit";
import { error, redirect, type Handle, type HandleServerError } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import dayjs from "dayjs";
import wildcardMatch from "wildcard-match";
import sessionCache from "$lib/server/caches/sessions.js";
import guildAccessCache from "$lib/server/caches/guildAccess.js";

const inDevMode = env.NODE_ENV === "development";

Sentry.init({
  dsn: PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});

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
    return new Response(null, { status: 404 }); // Return empty response with 404 Not Found
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

    // Check cache first
    const cached = sessionCache.get(sessionToken);
    if (cached) {
      return cached;
    }

    try {
      // Find session in database
      const tokenResult = await SessionManager.getUserTokenBySession(sessionToken);

      if (tokenResult.isExpired()) {
        const result: SafeSessionResult = { error: "expired", token: tokenResult.token, user: null };
        sessionCache.set(sessionToken, result);
        return result;
      } else if (!tokenResult.isFound()) {
        return { user: null, token: null, error: "notfound" };
      }

      const { token } = tokenResult;

      // Find user by session's userId
      const userRes = await new DiscordUserAPI(token.accessToken).getCurrentUser();
      if (!userRes.isSuccess()) {
        console.log(userRes);
        if (userRes.status === null && (userRes.error as any).code === "ENOTFOUND") {
          return { user: null, token: null, error: "network" };
        }
        return { user: null, token: null, error: "other" };
      }

      const result: SafeSessionResult = { user: userRes.data, token: tokenResult.token };
      // Cache successful results
      sessionCache.set(sessionToken, result);
      return result;
    } catch (error) {
      console.error("Session validation error:", error);
      return { user: null, token: null, error: "other" };
    }
  };

  event.locals.isAuthenticated = () => Boolean(event.locals.user && event.locals.token);

  // Consolidate: Get session data immediately instead of in separate handler
  const sessionData = await event.locals.getSafeSession();
  event.locals.user = sessionData.user;
  event.locals.token = sessionData.token;

  return resolve(event);
};

// Remove mainAuthGuard - functionality moved to authHandler

type APIRouteConfig = {
  /**
   * Whether the route allows unauthenticated access.
   *
   * @default false
   */
  allowUnauthenticated?: boolean;
  /**
   * Optional list of HTTP methods that the route supports.
   *
   * - If not specified, the all methods are allowed.
   * - If specified, only the listed methods are allowed.
   */
  methods?: string[];
};

const UNAUTHENTICATED_ROUTES: Record<string, APIRouteConfig> = {
  "/api/*/testing": { allowUnauthenticated: true },
};

// Optimize route matching with compiled patterns
const compiledUnauthRoutes = Object.entries(UNAUTHENTICATED_ROUTES).map(([pattern, config]) => ({
  matcher: pattern.includes("*") ? wildcardMatch(pattern, { flags: "i" }) : null,
  exactPath: pattern.includes("*") ? null : pattern,
  config,
}));

function isUnauthenticatedRoute(pathname: string): boolean {
  for (const { matcher, exactPath, config } of compiledUnauthRoutes) {
    if (exactPath ? pathname === exactPath : matcher?.(pathname)) {
      return typeof config.allowUnauthenticated === "undefined" ? false : config.allowUnauthenticated;
    }
  }
  return false;
}

/**
 * The general API Auth Guard.
 *
 * @see {@link Handle}
 */
const apiAuthGuard: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;

  // Early return for non-API routes
  if (!pathname.startsWith("/api/")) {
    return resolve(event);
  }

  // Check if route allows unauthenticated access
  if (isUnauthenticatedRoute(pathname)) {
    return resolve(event);
  }

  // Require authentication for all other API routes
  if (!event.locals.isAuthenticated()) {
    error(401, { message: "Authentication required", status: 401 });
  }

  return resolve(event);
};

const GUILD_ROUTES = ["/api/*/guilds/**", "/g/**"];

// Compile guild route patterns once
const compiledGuildRoutes = GUILD_ROUTES.map((pattern) =>
  pattern.includes("*") ? wildcardMatch(pattern, { flags: "i" }) : null,
);

const guildAuthGuard: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;
  const guildId = event.params.guildid;

  // Early returns for non-guild routes
  if (!guildId || (!pathname.startsWith("/api/") && !pathname.startsWith("/g"))) {
    return resolve(event);
  }

  event.locals.guildId = guildId;

  // Authentication check
  if (!event.locals.token || !event.locals.user) {
    if (pathname.startsWith("/g")) {
      redirect(303, `/login` + (pathname.length > 1 ? `?next=${pathname}` : ""));
    }
    return JsonErrors.unauthorized();
  }

  const userRest = new DiscordUserAPI(event.locals.token.accessToken);
  event.locals.discordUserRest = userRest;

  // Check if this is a guild route using compiled patterns
  const isGuildRoute = compiledGuildRoutes.some((matcher) =>
    matcher ? matcher(pathname) : GUILD_ROUTES.includes(pathname),
  );

  if (isGuildRoute) {
    const cacheKey = `${event.locals.user.id}:${guildId}`;
    const cached = guildAccessCache.get(cacheKey);

    if (cached && cached.value !== 200) {
      error(403);
    } else if (!cached) {
      const accessResult = await checkUserGuildAccess(event.locals.user.id, guildId, userRest);

      if (accessResult !== 200) {
        error(accessResult);
      }

      guildAccessCache.set(cacheKey, { value: accessResult });
    }
  }

  return resolve(event);
};

export const handle = sequence(
  devToolsCheck,
  authHandler, // Now includes mainAuthGuard functionality
  apiRateLimitCheck,
  apiAuthGuard,
  guildAuthGuard,
);

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
  const errorId =
    status !== 404 && !dev
      ? Sentry.captureException(error, {
          extra: { event, status },
        })
      : crypto.randomUUID();

  if (dev) {
    console.error("❌ Something has errored");
    console.error(error);
  }

  return {
    message: message || "Internal server error",
    id: errorId,
    status: status,
  };
};
