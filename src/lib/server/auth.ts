import { env } from "$env/dynamic/private";
import { getUserGuilds } from "$lib/cache/guilds";
import { cacheToken } from "$lib/cache/users";
import { API_BASE, APIRoutes } from "$lib/constants";
import jwt from "jsonwebtoken";

export function createSessionToken(userId: string, accessToken: string): string {
  return jwt.sign({ id: userId, at: accessToken }, env.JWT_SECRET, {
    expiresIn: "1d",
    algorithm: "HS256",
    encoding: "utf-8",
    issuer: "supportmail",
  });
}

/**
 * Validate a session and return the JWT payload or null.
 */
export async function verifySessionToken(token: string): Promise<{ id: string; accessToken: string } | null> {
  try {
    const _token = jwt.verify(token, env.JWT_SECRET, { issuer: "supportmail" }) as jwt.JwtPayload;
    cacheToken(_token.id, _token.at);
    return { id: _token.id, accessToken: _token.at };
  } catch (e) {
    return null;
  }
}

export async function checkUserGuildAccess(token: string, guildId: string): Promise<boolean | undefined> {
  const verified = await verifySessionToken(token);
  if (!verified) return false;

  let guilds = getUserGuilds(verified.id)?.map((g) => g.id);
  if (!guilds) {
    guilds = await fetch(env.ORIGIN + APIRoutes.userGuilds(verified.id, { bypassCache: true, manageBotOnly: true }), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }).then(
      async (res) => {
        if (res.ok) {
          console.log("Fetched guilds");
          const cachableGuilds = (await res.json()) as CachableGuild[];
          console.log(cachableGuilds.length);
          return cachableGuilds.map((g) => g.id);
        } else {
          console.log("Failed to fetch guilds (1)", res);
          return undefined;
        }
      },
      () => {
        console.log("Failed to fetch guilds (2)");
        return undefined;
      },
    );
  }

  return guilds?.includes(guildId);
}
