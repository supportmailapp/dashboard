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
import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/sveltekit";
import { inspect } from "util";
import { ErrorResponses } from "$lib/constants";

const inDevMode = env.NODE_ENV === "development";

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

// Configure Arcjet for API rate limiting
// For a Discord dashboard API, reasonable limits would be:
// - 60 requests per minute
const aj = arcjet({
  key: env.ARCJET_KEY!, // Get your site key from https://app.arcjet.com
  characteristics: ["ip.src"], // Track requests by IP
  rules: [
    shield({ mode: env.ARCJET_MODE! as any }),
    detectBot({
      mode: env.ARCJET_MODE! as any,
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    tokenBucket({
      mode: env.ARCJET_MODE! as any,
      refillRate: inDevMode ? 60000 : 60,
      interval: inDevMode ? 60000 : 60,
      capacity: inDevMode ? 60000 : 60,
    }),
  ],
});

const baseHandle: Handle = async ({ event, resolve }) => {
  // Early exit for API routes
  if (event.url.pathname.startsWith("/api")) {
    return await resolve(event);
  }

  const sessionCookie = event.cookies.get("session");

  if (sessionCookie) {
    const tokenData = verifySessionToken(sessionCookie);
    if (tokenData) {
      event.locals.user = await fetchUserData(tokenData.id);
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

const isRouteWithGuildId = (url: URL) => {
  return url.pathname.toLowerCase().match(/\/api\/v\d+\/(config|guilds)(\/\S*)?/i);
};

const handleApiRequest: Handle = async ({ event, resolve }) => {
  if (isProtectedRoute(event.url)) {
    // Get authentication information
    let eToken = event.cookies.get("session");
    if (!eToken) {
      const authHeader = event.request.headers.get("Authorization");
      if (authHeader?.startsWith("Session ")) {
        eToken = authHeader.split(" ")[1];
      }
    }

    event.locals.token = eToken;
    const decision = await aj.protect(event, { requested: 1 }); // Deduct 5 tokens from the bucket
    console.log("Arcjet decision", decision);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return ErrorResponses.tooManyRequests();
      } else if (decision.reason.isBot()) {
        return new Response(null, { status: 403, statusText: "Forbidden" });
      } else {
        return ErrorResponses.forbidden();
      }
    }

    if (isRouteWithGuildId(event.url)) {
      // These are the route params that are used in the API
      const guildId = event.params.guildid || event.params.slug;

      if (!guildId || !eToken) {
        return ErrorResponses.badRequest("Missing required parameters");
      }
      const hasAccess = await checkUserGuildAccess(eToken, guildId);
      if (hasAccess === false) {
        return ErrorResponses.forbidden();
      }

      event.locals.guildId = guildId;
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

  return {
    message: message || "Internal server error",
    errorId: errorId,
  };
};
