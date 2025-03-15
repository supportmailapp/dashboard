import { env } from "$env/dynamic/private";
import { getUserGuilds, overwriteUserGuilds, parseToCacheGuild, setGuilds } from "$lib/cache/guilds";
import { cacheToken } from "$lib/cache/users";
import { APIRoutes } from "$lib/constants";
import { fetchUserGuilds } from "$lib/discord/oauth2";
import jwt from "jsonwebtoken";
import clientAPI from "./clientApi";
import { canManageBot } from "$lib/utils/permissions";

export function createSessionToken(userId: string, accessToken: string): string {
  return jwt.sign({ id: userId, at: accessToken }, env.JWT_SECRET, {
    expiresIn: "3d",
    algorithm: "HS256",
    encoding: "utf-8",
    issuer: "supportmail",
  });
}

/**
 * Validate a session and return the JWT payload or null.
 */
export function verifySessionToken(token: string): { id: string; accessToken: string } | null {
  try {
    const _token = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    cacheToken(_token.id, _token.at);
    return { id: _token.id, accessToken: _token.at };
  } catch (e) {
    return null;
  }
}

export async function checkUserGuildAccess(token: string, guildId: string): Promise<boolean | undefined> {
  const verified = verifySessionToken(token);
  if (!verified) return false;

  let guilds: CachableGuild[] | null = getUserGuilds(verified.id);
  let guildIds: string[] = [];
  if (!guilds) {
    const guildsRes = await fetchUserGuilds(verified.id, verified.accessToken, {
      fullGuilds: true,
    });
    guildIds = guildsRes.map((g) => g.id);

    const validBotGuildIds = await clientAPI.filterMutualGuilds(guildIds);
    let modifedGuilds = guildsRes.map((g) => parseToCacheGuild(g, validBotGuildIds.includes(guildId)));

    setGuilds(...modifedGuilds);
    overwriteUserGuilds(
      verified.id,
      modifedGuilds.map((g) => g.id),
    );

    guilds = modifedGuilds.filter((guild) => canManageBot(BigInt(guild.permissions)));
    guildIds = guilds.map((g) => g.id);
  } else {
    guildIds = guilds.map((g) => g.id);
  }

  return guildIds?.includes(guildId);
}
