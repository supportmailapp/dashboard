import { env } from "$env/dynamic/private";
import { getUserGuilds } from "$lib/cache/guilds";
import { fetchUserGuilds } from "$lib/discord/utils";
import type { RESTPostOAuth2AccessTokenResult } from "discord-api-types/v10";
import jwt from "jsonwebtoken";
import type { IDBUser } from "supportmail-types";
import { DBUser, getUser } from "./db";
import { getDBUser } from "$lib/cache/users";

export function createSessionToken(userId: string, stayLoggedIn: boolean): string {
  return jwt.sign({ id: userId, stayLoggedIn: stayLoggedIn }, env.JWT_SECRET, {
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

type ValidateSessionTokenResult =
  | { type: "valid"; id: string; stayLoggedIn: boolean }
  | { type: "invalid"; id: null; stayLoggedIn: false }
  | { type: "expired"; id: string; stayLoggedIn: boolean; expired: true };

/**
 * Validate a session and return the JWT payload or null.
 *
 * @returns
 * - `{ id: string; stayLoggedIn: boolean }` if the token is valid (is can be logged in)
 * - `{ id: null; stayLoggedIn: false }` if the token is invalid
 * - `{ id: string; stayLoggedIn: boolean; expired: true; }` if the token is expired
 */
export function verifySessionToken(token: string): ValidateSessionTokenResult {
  try {
    const _token = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "supportmail",
    }) as jwt.JwtPayload;
    return { type: "valid", id: _token.id, stayLoggedIn: !!_token.stayLoggedIn };
  } catch (e: any) {
    if (e instanceof jwt.TokenExpiredError) {
      const _token2 = jwt.decode(token) as jwt.JwtPayload;
      return { type: "expired", id: _token2.id, expired: true, stayLoggedIn: !!_token2.stayLoggedIn };
    }
    return { type: "invalid", id: null, stayLoggedIn: false };
  }
}

export async function checkUserGuildAccess(
  userId: string,
  aToken: string,
  guildId: string,
): Promise<boolean | undefined> {
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

export async function hasPremium(guildId: string, userId: string | null = null) {
  return false;
  /* Not implemented yet... */
}
