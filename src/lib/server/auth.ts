import { env } from "$env/dynamic/private";
import { getUserGuilds } from "$lib/cache/guilds";
import { fetchUserGuilds } from "$lib/discord/utils";
import type { RESTPostOAuth2AccessTokenResult } from "discord.js";
import jwt from "jsonwebtoken";
import type { IDBUser } from "supportmail-types";
import { DBUser, getUser } from "./db";
import { getDBUser } from "$lib/cache/users";

export function createSessionToken(userId: string): string {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: "3d",
    algorithm: "HS256",
    encoding: "utf-8",
    issuer: "supportmail",
  });
}

/**
 * Signs a pair of access and refresh tokens for storage in the database.
 */
export function encodeDbTokens({ access_token, refresh_token }: RESTPostOAuth2AccessTokenResult): string {
  return jwt.sign({ at: access_token, rt: refresh_token }, env.DB_ENCRPYTION_KEY, {
    algorithm: "HS256",
    issuer: "supportmail",
    encoding: "utf-8",
  });
}

// The refreshToken can be null if the user has not authorized the bot to refresh the token.
type DBTokensResult = { accessToken: string; refreshToken: string | null } | { accessToken: null; refreshToken: null };

export function decodeDbTokens(token: string): DBTokensResult {
  try {
    const decoded = jwt.verify(token, env.DB_ENCRPYTION_KEY) as { at: string; rt: string };
    return { accessToken: decoded.at, refreshToken: decoded.rt || null };
  } catch (e) {
    return { accessToken: null, refreshToken: null };
  }
}

/**
 * Validate a session and return the JWT payload or null.
 */
export function verifySessionToken(token: string): { id: string | null } {
  try {
    const _token = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    return { id: _token.id };
  } catch (e) {
    return { id: null };
  }
}

export async function checkUserGuildAccess(userId: string, aToken: string, guildId: string): Promise<boolean | undefined> {
  if (userId === env.ownerId) return true;

  let guilds: DCGuild[] | null = getUserGuilds(userId);
  let guildIds: string[] = [];
  if (!guilds) {
    guilds = await fetchUserGuilds(userId, aToken);
    guildIds = guilds.map((g) => g.id);
  } else {
    guildIds = guilds.map((g) => g.id);
  }

  return guildIds?.includes(guildId);
}

export function fetchDBUser(userId: string) {
  const cachedUser = getDBUser(userId);
  if (cachedUser) return new Promise<IDBUser>((resolve) => resolve(cachedUser));
  return DBUser.findOne({ id: userId }, null, { lean: true });
}
