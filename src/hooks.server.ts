import { getUserData, getUserGuilds } from "$lib/discord/oauth2";
import { decodeToken, verifyTokenPayload, type FullCookieToken } from "$lib/server/auth";
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

  const dToken = decodeToken(token);
  const verifedToken = verifyTokenPayload(dToken);
  if (!verifedToken) {
    // event.cookies.delete("discord-token", { path: "/" });
    if (event.url.pathname !== "/") {
      console.log("2: Redirecting to /");
      return redirect(303, "/");
    }
    return resolve(event);
  }

  const userData = await getUserData(verifedToken.access_token, event.fetch);

  if (!userData) {
    throw { message: "Invalid user data" };
  }
  event.locals.currentUser = apiUserToCurrentUser(userData);

  // Fetch user guilds
  const guilds = await getUserGuilds(event.locals.currentUser.id, verifedToken.access_token, event.fetch);

  if (!guilds) {
    throw { message: "Invalid guilds data" };
  }

  event.locals.guilds = guilds.map(apiPartialGuildToPartialGuild);

  // Add guild ID to locals
  if (/^\/(\d+)\S+/.test(event.url.pathname)) {
    const guildIdMatch = event.url.pathname.match(/^\/(\d+)\S+/);

    if (guildIdMatch) {
      const guildId = guildIdMatch[1];
      const guild = event.locals.guilds.find((g) => g.id === guildId);

      if (guild) {
        // TODO: Fetch channels and roles for active guild from client API
        /*
          Any type is used here because it's hard to sync the types between the client api and dashboard
          Typically there is at least `id`, `name`, `position` and `type` for channels
          Typically there is at least `id`, `name`, `color` and `position` for roles
        */
        let channels: any[] = [];
        let roles: any[] = [];

        event.locals.currentGuild = apiPartialGuildToCurrentGuild(guild, channels, roles);
      }
    }
  }

  const response = await resolve(event);
  return response;
};

// export async function handleError() {}
