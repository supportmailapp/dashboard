import { getUserData } from "$lib/discord/oauth2";
import { decodeToken } from "$lib/server/auth";
// @ts-ignore
import Sentry from "$lib/server/sentry";
import { apiUserToCurrentUser } from "$lib/utils/formatting";
import { redirect, type Handle, type HandleServerError, type ServerInit } from "@sveltejs/kit";

import { inspect } from "util";

export const init: ServerInit = async () => {
  // DB Connection
};

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/api")) {
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

  const userData = await getUserData(dToken.access_token, event.fetch);

  if (!userData) {
    throw { message: "Invalid user data" };
  }
  event.locals.user = apiUserToCurrentUser(userData);

  const response = await resolve(event);
  return response;
};

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
  // const errorId = Sentry.captureException(error, {
  //   extra: { event, status },
  // });

  console.error(inspect(error));

  const errorId = crypto.randomUUID();

  return {
    message: message || "Internal server error",
    errorId: errorId,
  };
};
