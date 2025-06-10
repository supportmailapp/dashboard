import type { RESTAPIPartialCurrentUserGuild } from "discord-api-types/v10";
import NodeCache from "node-cache";

// Cache for Discord users (profile data)
const userGuildsCache = new NodeCache({
  stdTTL: 1800, // 30 minutes
  checkperiod: 60,
});

// Discord User cache methods
function cacheUserGuilds(userId: string, guilds: RESTAPIPartialCurrentUserGuild[]): void {
  userGuildsCache.set(userId, guilds);
}

function getUserGuilds(userId: string): RESTAPIPartialCurrentUserGuild[] | null {
  return userGuildsCache.get(userId) || null;
}

function removeUserGuilds(userId: string): void {
  userGuildsCache.del(userId);
}

function clearUserGuilds(): void {
  userGuildsCache.flushAll();
}

export default {
  cacheUserGuilds,
  getUserGuilds,
  removeUserGuilds,
  clearUserGuilds,
};
