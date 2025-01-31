import { getUserGuilds } from "$lib/cache/guilds";
import { Guild } from "$lib/classes/guilds";
import { fetchUserData } from "$lib/discord/oauth2";
import { decodeToken } from "$lib/server/auth";
// @ts-ignore
import * as Sentry from "@sentry/node";
import { apiUserToCurrentUser } from "$lib/utils/formatting";
import { redirect, type Handle, type HandleServerError, type ServerInit } from "@sveltejs/kit";

import { inspect } from "util";

export const init: ServerInit = async () => {
  console.log("We are online!");
};

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/api")) {
    console.log("API request", event);
    const response = await resolve(event);
    return response;
  }

  const token = event.cookies.get("discord-token");
  console.log("Token:", token);
  if (!token) {
    console.log("No token found");
    if (event.url.pathname !== "/") {
      if (event.url.searchParams.size > 0) {
        return redirect(302, "/?redirect=" + event.url.toString());
      } else {
        return redirect(302, "/");
      }
    } else {
      return await resolve(event);
    }
  } else {
    console.log("Token found");
  }

  const dToken = decodeToken(token, true);
  if (!dToken) {
    event.cookies.delete("discord-token", { path: "/" });
    if (event.url.pathname !== "/") {
      return redirect(307, "/");
    }
    // If token is invalid and the user accesses the home page, we don't want to redirect them to the home page again
    return await resolve(event);
  }

  if (!event.locals.user) {
    const user = await fetchUserData(dToken.access_token, fetch, dToken.userId).catch(() => null);
    event.locals.user = apiUserToCurrentUser(user);
  }

  if (!event.locals.guilds) {
    const guildsResult = getUserGuilds(dToken.userId, dToken.access_token);
    if (guildsResult) {
      event.locals.configuredGuilds = guildsResult.configured;
      event.locals.guilds = guildsResult.guilds.map((g) => Guild.from(g, guildsResult.configured.includes(g.id)));
    }
  }

  const response = await resolve(event);
  return response;
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
