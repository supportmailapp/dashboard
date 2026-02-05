import type { RESTAPIPartialCurrentUserGuild } from "discord-api-types/v10";
import NodeCache from "node-cache";

const guildsCache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 120,
  errorOnMissing: false,
});

// Cache for Discord users (profile data)
const userGuildsCache = new NodeCache({
  stdTTL: 900, // 30 minutes
  checkperiod: 60,
  errorOnMissing: false,
});

// Discord User cache methods
function cacheUserGuilds(userId: string, guilds: RESTAPIPartialCurrentUserGuild[]): void {
  guildsCache.mset(guilds.map((guild) => ({ key: guild.id, val: guild })));
  userGuildsCache.set(
    userId,
    guilds.map((guild) => guild.id),
  );
}

function hasUser(userId: string): boolean {
  return userGuildsCache.has(userId);
}

function getUserGuilds(userId: string): RESTAPIPartialCurrentUserGuild[] | null {
  const gids = userGuildsCache.get<string[]>(userId);
  if (!gids) return null;
  const guilds = guildsCache.mget<RESTAPIPartialCurrentUserGuild>(gids) || null;
  if (!guilds) return null;
  return Object.values(guilds);
}

function removeUserGuilds(userId: string): void {
  userGuildsCache.del(userId);
}

function clearUserGuilds(): void {
  userGuildsCache.flushAll();
}

export default {
  cacheUserGuilds,
  hasUser,
  getUserGuilds,
  removeUserGuilds,
  clearUserGuilds,

  getGuild: (guildId: string) => guildsCache.get<RESTAPIPartialCurrentUserGuild>(guildId),
  setGuild: (guild: RESTAPIPartialCurrentUserGuild) => {
    guildsCache.set(guild.id, guild);
  },
  clearGuilds: () => {
    guildsCache.flushAll();
  },
};
