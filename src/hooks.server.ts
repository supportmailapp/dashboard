import { getUserData, getUserGuilds } from "$lib/discord/oauth2";
import { decodeToken, type FullCookieToken } from "$lib/server/auth";
import { apiPartialGuildToCurrentGuild, apiPartialGuildToPartialGuild, apiUserToCurrentUser } from "$lib/utils/formatting";
import { redirect, type Handle, type ServerInit } from "@sveltejs/kit";

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
      console.log("1: Redirecting to /");
      return redirect(303, "/");
    }
  } else {
    console.log("Token found");
  }

  const dToken = decodeToken(token, true);
  if (!dToken) {
    // event.cookies.delete("discord-token", { path: "/" });
    if (event.url.pathname !== "/") {
      console.log("2: Redirecting to /");
      return redirect(303, "/");
    }
    return resolve(event);
  }

  const userData = await getUserData(dToken.access_token, event.fetch);

  if (!userData) {
    throw { message: "Invalid user data" };
  }
  event.locals.currentUser = apiUserToCurrentUser(userData);

  const response = await resolve(event);
  return response;
};

// export async function handleError() {}
