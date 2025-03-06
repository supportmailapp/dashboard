import { env } from "$env/dynamic/private";
import { getUserGuilds } from "$lib/cache/guilds";
import { mongoDB } from "$lib/server/db";
import { fetchUserData } from "$lib/discord/oauth2";
import { checkUserGuildAccess, verifySessionToken } from "$lib/server/auth";
import { guilds } from "$lib/stores/guilds.svelte";
import { user } from "$lib/stores/user.svelte";
import * as Sentry from "@sentry/node";
import { error, redirect, type Handle, type HandleServerError, type ServerInit } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import dayjs from "dayjs";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import { inspect } from "util";
import { ErrorResponses } from "$lib/constants";

export const init: ServerInit = async () => {
  mongoDB
    .connect()
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error("MongoDB failed to connect", err);
      process.exit(1);
    });

  console.log("Environment:", env.NODE_ENV);
  console.log("Server started at", dayjs().toString());
};

const apiRateLimiter = new RateLimiterMemory({ duration: 4, points: 8, blockDuration: 10, keyPrefix: "API" });

const baseHandle: Handle = async ({ event, resolve }) => {
  // Early exit for API routes
  if (event.url.pathname.startsWith("/api")) {
    return await resolve(event);
  }

  const sessionCookie = event.cookies.get("session");

  if (sessionCookie) {
    const tokenData = verifySessionToken(sessionCookie);
    if (tokenData) {
      event.locals.user = await fetchUserData(tokenData.id, event.fetch);
    }
  } else {
    if (!event.url.pathname.startsWith("/login")) {
      const redirectUrl = new URL("/login", event.url.origin);
      if (event.url.pathname !== "/") {
        redirectUrl.searchParams.set("redirect", event.url.pathname);
      }
      return redirect(303, redirectUrl.toString());
    } else {
      return resolve(event);
    }
  }

  if (event.locals.user) {
    const _guilds = getUserGuilds(event.locals.user.id);
    if (_guilds) {
      guilds.set(_guilds);
    }
  }

  return resolve(event);
};

const notProtectedRoutes = ["testing", "discord-auth", "logout"];

const isProtectedRoute = (url: URL) => {
  const pathname = url.pathname.toLowerCase();
  return pathname.startsWith("/api") && !pathname.match(new RegExp(`/api/v\\d+/${notProtectedRoutes.join("|")}`, "i"));
};

const isUserRoute = (url: URL) => {
  return url.pathname.toLowerCase().match(/\/api\/v\d+\/users\/(\d+)(\/\S*)?/i);
};

const handleApiRequest: Handle = async ({ event, resolve }) => {
  if (isProtectedRoute(event.url)) {
    const decision = await apiRateLimiter
      .consume(event.getClientAddress(), 1)
      .then((res: RateLimiterRes) => {
        event.setHeaders({
          "X-RateLimit-Remaining": `${res.remainingPoints}`,
          "X-RateLimit-Reset": `${~~(res.msBeforeNext / 1000)}`,
        });
        return res;
      })
      .catch((rej: RateLimiterRes) => {
        event.setHeaders({
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": `${~~(rej.msBeforeNext / 1000)}`,
        });
        return rej;
      });

    if (decision.remainingPoints < 1) {
      return error(429, {
        message: "Rate limit exceeded",
      });
    }

    let token = event.cookies.get("session");
    if (!token) {
      const authHeader = event.request.headers.get("Authorization");
      if (authHeader?.startsWith("Session ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!event.url.pathname.endsWith("news") && !isUserRoute(event.url)) {
      // These are the route params that are used in the API
      const guildId = event.params.guildid || event.params.slug;

      if (!guildId || !token) {
        return ErrorResponses.badRequest("Missing required parameters");
      }
      const hasAccess = await checkUserGuildAccess(token, guildId, event.fetch);
      if (hasAccess === false) {
        return ErrorResponses.forbidden();
      }

      event.locals.guildId = guildId;
      event.locals.token = token;
    } else if (isUserRoute(event.url)) {
      const sessionToken = event.cookies.get("session") || event.request.headers.get("Authorization")?.split(" ")[1];
      if (!sessionToken) {
        return ErrorResponses.unauthorized();
      }
      const userId = verifySessionToken(sessionToken)?.id;
      if (!userId || userId !== (event.params.userid || event.params.slug)) {
        return ErrorResponses.forbidden();
      }
      event.locals.userId = userId;
    }
  }

  if (event.url.searchParams.get("bypass_cache") == "true") {
    event.locals.bypassCache = true;
  }

  return resolve(event);
};

export const handle = sequence(baseHandle, handleApiRequest);

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
  const errorId = Sentry.captureException(error, {
    extra: { event, status },
  });

  console.error(inspect(error));

  // const errorId = crypto.randomUUID();

  return {
    message: message || "Internal server error",
    errorId: errorId,
  };
};
