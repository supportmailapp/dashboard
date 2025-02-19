import { env } from "$env/dynamic/private";
import { getUserGuilds } from "$lib/cache/guilds";
import { API_BASE } from "$lib/constants";
import * as Mongo from "$lib/db/mongo";
import { fetchUserData } from "$lib/discord/oauth2";
import { verifySessionToken } from "$lib/server/auth";
import { guilds } from "$lib/stores/guilds.svelte";
import { user } from "$lib/stores/user.svelte";
import * as Sentry from "@sentry/node";
import { error, type Handle, type HandleServerError, type ServerInit } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import { inspect } from "util";

export const init: ServerInit = async () => {
  Mongo.connect()
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error("MongoDB failed to connect", err);
      process.exit(1);
    });

  console.log("Environment:", env.NODE_ENV);
  console.log("Server started at", new Date().toISOString());
};

const apiRateLimiter = new RateLimiterMemory({ duration: 4, points: 7, blockDuration: 10, keyPrefix: "API" });

const baseHandle: Handle = async ({ event, resolve }) => {
  // Early exit for API routes
  if (event.url.pathname.startsWith("/api")) {
    let response = await apiRateLimiter
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

    if (response.remainingPoints < 1) {
      return error(429, {
        message: "Rate limit exceeded",
      });
    }
    return resolve(event);
  }

  const sessionCookie = event.cookies.get("session");

  if (sessionCookie) {
    const tokenData = await verifySessionToken(sessionCookie);
    if (tokenData) {
      event.locals.user = await fetchUserData(tokenData.id, event.fetch);
      user.set(event.locals.user);
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

const isProtectedRoute = (url: URL) => {
  const pathname = url.pathname.toLowerCase();
  return pathname.startsWith("/api") && pathname != `${API_BASE}/discord-auth`;
};

const handleApiRequest: Handle = async ({ event, resolve }) => {
  if (isProtectedRoute(event.url)) {
    // These are the route params that are used in the API
    const guildId = event.params.guildid || event.params.slug;
    let token = event.cookies.get("session");
    if (!token) {
      const authHeader = event.request.headers.get("Authorization");
      if (authHeader?.startsWith("Session")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!guildId || !token) {
      return Response.json(null, { status: 400, statusText: "Bad Request" });
    } else {
    }

    event.locals.guildId = guildId;
    event.locals.token = token;
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
