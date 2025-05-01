import { env } from "$env/dynamic/private";
import { ErrorResponses } from "$lib/constants";
import { fetchUserData } from "$lib/discord/utils";
import { checkUserGuildAccess, decodeDbTokens, fetchDBUser, verifySessionToken } from "$lib/server/auth";
import { dbConnect } from "$lib/server/db";
import { anyUserToBasic } from "$lib/utils/formatting";
import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/sveltekit";
import * as Sentry from "@sentry/node";
import { type Handle, type HandleServerError, type ServerInit } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import dayjs from "dayjs";
import { inspect } from "util";

const inDevMode = env.NODE_ENV === "development";

export const init: ServerInit = async () => {
  await dbConnect();
  console.log("Environment:", env.NODE_ENV);
  console.log("Server started at", dayjs().toString());
};

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

const notProtectedRoutes = ["testing", "discord-auth", "logout"];

/**
 * Middleware to check if the API route is protected and requires a token.
 */
const apiIsProtected = (url: URL) =>
  url.pathname.startsWith("/api") && !url.pathname.match(new RegExp(`/api/v\\d+/${notProtectedRoutes.join("|")}`, "i"));
const isRouteWithGuildId = (url: URL) => url.pathname.toLowerCase().match(/\/api\/v\d+\/(config|guilds)(\/\S*)?/i);

const baseHandle: Handle = async function ({ event, resolve }) {
  let eToken = event.cookies.get("session");
  if (!eToken) {
    const authHeader = event.request.headers.get("Authorization");
    if (authHeader?.startsWith("Session ")) {
      eToken = authHeader.split(" ")[1];
    }
  }

  console.log("Session token", eToken);

  if (eToken) {
    const { id: userId } = verifySessionToken(eToken);
    if (userId) {
      event.locals.userId = userId;
      const dbUser = await fetchDBUser(userId);
      if (dbUser?.tokens) {
        const { accessToken } = decodeDbTokens(dbUser.tokens);
        event.locals.token = accessToken ?? undefined;
      }
    }
  }

  // Always try to fetch user data if token is available
  if (event.locals.userId && event.locals.token) {
    console.log("Fetching user data");
    const rawUser = await fetchUserData(event.locals.userId, event.locals.token);
    event.locals.user = anyUserToBasic(rawUser);
  }

  // Check if API request but no token
  if (!event.locals.token && apiIsProtected(event.url)) {
    console.log("No token found");
    return ErrorResponses.unauthorized();
  }

  return resolve(event);
};

const rateLimitHandle: Handle = async function ({ event, resolve }) {
  // Apply rate limiting to all routes, not just protected API routes
  const decision = await aj.protect(event);
  console.log("Arcjet decision", decision.conclusion, decision.reason);

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return ErrorResponses.tooManyRequests(decision.results[0].ttl);
    } else if (decision.reason.isBot()) {
      return new Response(null, { status: 403, statusText: "Forbidden" });
    } else {
      return ErrorResponses.forbidden();
    }
  }

  return resolve(event);
};

const guildAccessHandle: Handle = async ({ event, resolve }) => {
  if (apiIsProtected(event.url) && isRouteWithGuildId(event.url)) {
    // These are the route params that are used in the API
    const guildId = event.params.guildid;

    if (!guildId) {
      return ErrorResponses.badRequest("Missing required parameters");
    }

    const hasAccess = await checkUserGuildAccess(event.locals.userId!, event.locals.token!, guildId);
    if (hasAccess === false) {
      return ErrorResponses.forbidden();
    }

    event.locals.guildId = guildId;
  }

  if (event.url.searchParams.get("bypass_cache") == "true") {
    event.locals.bypassCache = true;
  }

  return resolve(event);
};

export const handle = sequence(baseHandle, rateLimitHandle, guildAccessHandle);

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
