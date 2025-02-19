import { getUserGuilds } from "$lib/cache/guilds";
import { fetchUserData } from "$lib/discord/oauth2";
import { verifySessionToken } from "$lib/server/auth";
import { guilds } from "$lib/stores/guilds.svelte";
import { user } from "$lib/stores/user.svelte";
import * as Sentry from "@sentry/node";
import { error, type Handle, type HandleServerError, type ServerInit } from "@sveltejs/kit";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import { inspect } from "util";
import { env } from "$env/dynamic/private";
import * as Mongo from "$lib/db/mongo";

export const init: ServerInit = async () => {
  try {
    await Mongo.connect();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB failed to connect", err);
    process.exit(1);
  }

  console.log("Environment:", env.NODE_ENV);
  console.log("Server started at", new Date().toISOString());
};

const apiRateLimiter = new RateLimiterMemory({ duration: 4, points: 7, blockDuration: 10, keyPrefix: "API" });

export const handle: Handle = async ({ event, resolve }) => {
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

  const sessionCookie = event.cookies.get("session_token");

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
