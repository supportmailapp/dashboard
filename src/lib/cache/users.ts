import type { APIUser } from "discord.js";
import NodeCache from "node-cache";
import type { IDBUser } from "supportmail-types";

// Cache for database users (has access tokens)
const dbUserCache = new NodeCache({
  stdTTL: 10800, // 3 hours
  checkperiod: 60,
});

// Cache for Discord users (profile data)
const discordUserCache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 60,
});

// DB User cache methods
export function cacheDBUser(userId: string, data: IDBUser): void {
  dbUserCache.set(userId, data);
}

export function getDBUser(userId: string): IDBUser | null {
  return dbUserCache.get(userId) || null;
}

export function removeDBUser(userId: string): void {
  dbUserCache.del(userId);
}

// Discord User cache methods
export function cacheDiscordUser(user: APIUser): void {
  discordUserCache.set(user.id, user);
}

export function getDiscordUser(userId: string): APIUser | null {
  return discordUserCache.get(userId) || null;
}

export function removeDiscordUser(userId: string): void {
  discordUserCache.del(userId);
}

// Clear methods
export function clearDBUsers(): void {
  dbUserCache.flushAll();
}

export function clearDiscordUsers(): void {
  discordUserCache.flushAll();
}
