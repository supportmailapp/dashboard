import { dev } from "$app/environment";
import { env } from "$env/dynamic/private";
import { JsonErrors } from "$lib/constants.js";
import { checkUserGuildAccess } from "$lib/server/auth";
import guildAccessCache from "$lib/server/caches/guildAccess.js";
import sessionCache from "$lib/server/caches/sessions.js";
import { dbConnect, UserToken } from "$lib/server/db";
import { DiscordBotAPI, DiscordUserAPI } from "$lib/server/discord";
import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/sveltekit";
import * as Sentry from "@sentry/sveltekit";
import { error, redirect, type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import dayjs from "dayjs";
import { isValidObjectId } from "mongoose";
import wildcardMatch from "wildcard-match";

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
      interval: dev ? 60000 : 60,
      max: dev ? 8000 : 100,
    }),
  ],
});

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

const authentification: Handle = async ({ event, resolve }) => {
  event.locals.discordRest = new DiscordBotAPI();

  const sessionId = event.cookies.get("session_id");
  event.locals.user = null;
  event.locals.token = null;

  if (sessionId) {
    let tokenData = sessionCache.get(sessionId);
    if (!tokenData && isValidObjectId(sessionId)) {
      const dbToken = await UserToken.findById(sessionId);
      if (!dbToken || dbToken.expiresAt < new Date()) {
        sessionCache.del(sessionId);
        event.cookies.delete("session_id", { path: "/" });
        return redirect(303, "/login?error=invalid_session");
      }

      const userApi = new DiscordUserAPI(dbToken.accessToken, dbToken.userId);
      const discordUser = await userApi.getCurrentUser();
      if (!discordUser.isSuccess()) {
        sessionCache.del(sessionId);
        event.cookies.delete("session_id", { path: "/" });
        return redirect(303, "/login?error=invalid_session");
      }

      tokenData = {
        user: discordUser.data,
        token: dbToken.toJSON(),
      };
      sessionCache.set(sessionId, tokenData);
    } else if (!tokenData) {
      // This happens if the session_id is not a valid object ID, because someone tampered with it
      event.cookies.delete("session_id", { path: "/" });
      return redirect(303, "/login?error=invalid_session");
    }

    event.locals.token = tokenData.token;
    event.locals.user = tokenData.user;
  }

  event.locals.isAuthenticated = () => !!event.locals.user && !!event.locals.token;

  return resolve(event);
};

const authorization: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/-") && !event.locals.user) {
    const next = "/" + event.url.pathname.split("/").slice(2).join("/");
    const guild = event.params.guildid;

    if (next || guild) {
      const redirectData: Record<string, string> = {};
      if (next && next !== "/") redirectData.next = next;
      if (guild) redirectData.guild = guild;
      event.cookies.set("login_redirect", JSON.stringify(redirectData), {
        path: "/",
        maxAge: 600,
      });
    }

    if (next && next !== "/") redirect(303, `/login?next=${encodeURIComponent(next)}`);
    else redirect(303, `/login`);
  }

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
  "/api/*/health": { allowUnauthenticated: true },
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
  if (!event.locals.user) {
    error(401, { message: "Authentication required", status: 401 });
  }

  return resolve(event);
};

const GUILD_ROUTES = ["/api/*/guilds/**", "/-/**"];

// Compile guild route patterns once
const compiledGuildRoutes = GUILD_ROUTES.map((pattern) =>
  pattern.includes("*") ? wildcardMatch(pattern, { flags: "i" }) : null,
);

const guildAuthGuard: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;
  const guildId = event.params.guildid;

  // Early returns for non-guild routes
  if (!guildId || (!pathname.startsWith("/api/") && !pathname.startsWith("/-"))) {
    return resolve(event);
  }

  // Authentication check
  if (!event.locals.token || !event.locals.user) {
    if (pathname.startsWith("/-")) {
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

const adminAuthRoutes = ["/api/*/admin/**", "/admin/**"];
const compiledAdminRoutes = adminAuthRoutes.map((pattern) =>
  pattern.includes("*") ? wildcardMatch(pattern, { flags: "i" }) : null,
);

const adminAuthGuard: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;

  event.locals.isAdmin = () => event.locals.token?.clearance === "admin";

  const isAdminRoute = compiledAdminRoutes.some((matcher) =>
    matcher ? matcher(pathname) : adminAuthRoutes.includes(pathname),
  );

  if (!isAdminRoute) {
    return resolve(event);
  }

  if (!event.locals.token || !event.locals.user) {
    return JsonErrors.unauthorized();
  }

  // Require admin clearance
  if (event.locals.token.clearance !== "admin") {
    return JsonErrors.forbidden();
  }

  return resolve(event);
};

export const handle = sequence(
  Sentry.initCloudflareSentryHandle({
    dsn: "https://f3539027417a80678d1015bba5b684e5@o4508704165265408.ingest.de.sentry.io/4508704168018000",
    sendDefaultPii: true,
    enableLogs: true,
    tracesSampleRate: dev ? 1.0 : 0.5,
  }),
  Sentry.sentryHandle(),
  authentification,
  authorization,
  apiRateLimitCheck,
  apiAuthGuard,
  guildAuthGuard,
  adminAuthGuard,
);

export const handleError = dev
  ? ({ error }: any) => {
      console.error("Error occurred:", error);
      return {
        message: "An error occurred",
      };
    }
  : Sentry.handleErrorWithSentry();
