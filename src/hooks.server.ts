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
  if (!token) {
    console.log("No token found, redirecting to login");
    if (!event.url.pathname.startsWith("/login")) {
      return redirect(303, "/login");
    }
    return resolve(event);
  }

  let verifedToken: FullCookieToken | null = null;
  try {
    const dToken = decodeToken(token);
    verifedToken = verifyTokenPayload(dToken);
    if (!verifedToken) {
      throw { status: 401, redirect: "/login" };
    }

    const userData = await getUserData(verifedToken.access_token, event.fetch);

    if (!userData) {
      throw { status: 500, redirect: "/login" };
    }
    event.locals.currentUser = apiUserToCurrentUser(userData);
  } catch (e: any) {
    return redirect(e.status || 500, e.redirect || "/login");
  }

  // Fetch user guilds
  try {
    const guilds = await getUserGuilds(event.locals.currentUser.id, verifedToken.access_token, event.fetch);

    if (!guilds) {
      throw { status: 500, redirect: "/login" };
    }

    event.locals.guilds = guilds.map(apiPartialGuildToPartialGuild);
  } catch (e: any) {
    return redirect(e.status || 500, e.redirect || "/login");
  }

  // Add guild ID to locals
  if (event.url.pathname != "/") {
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
