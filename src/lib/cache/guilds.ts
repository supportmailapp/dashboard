import type { RESTAPIPartialCurrentUserGuild } from "discord-api-types/v10";
import NodeCache from "node-cache";

// All the BasicGuilds currently in the cache
const guildsCache = new NodeCache({
  stdTTL: 900,
  checkperiod: 30,
  errorOnMissing: false,
});

type GuildsCacheValue = RESTAPIPartialCurrentUserGuild | undefined;

// Maps a user ID to an array of guilds the user is in
// Format: `{accessToken}-{userId}` -> `guildIds`
const userGuildsStore = new NodeCache({
  stdTTL: 600,
  checkperiod: 30,
  errorOnMissing: false,
});

type UserGuildsMappingValue = string[] | undefined;

function buildUserKey(userId: string, accessToken: string): string {
  return `${accessToken}:${userId}`;
}

/**
 * Sets the user's guilds in the userGuildsStore and caches the guilds in the guildsCache.
 *
 * @param userId - The ID of the user.
 * @param accessToken - The access token of the user.
 * @param guilds - An array of partial guild objects associated with the user.
 */
export function setUserWithGuilds(userId: string, accessToken: string, guilds: RESTAPIPartialCurrentUserGuild[]): void {
  const guildIds = guilds.map((guild) => guild.id);
  userGuildsStore.set(buildUserKey(userId, accessToken), guildIds);
  guildsCache.mset<RESTAPIPartialCurrentUserGuild>(
    guilds.map((guild) => ({
      key: guild.id,
      val: guild,
    })),
  );
}

/**
 * Retrieves the guilds associated with the user from the cache.
 *
 * @param userId - The unique identifier of the user.
 * @param accessToken - The access token of the user.
 * @param guildIds - An array of partial guild objects representing the guilds the user is a member of.
 */
export function getUserGuilds(userId: string, accessToken: string): RESTAPIPartialCurrentUserGuild[] {
  const guildIds = userGuildsStore.get<UserGuildsMappingValue>(buildUserKey(userId, accessToken));
  if (!guildIds) {
    return [];
  }
  const guildsList = guildsCache.mget<GuildsCacheValue | undefined>(guildIds);
  if (!guildsList || Object.values(guildsList).length != guildIds.length) {
    return []; // If any of the guilds are missing, return an empty array to fetch the user's guilds again
  }
  return Object.values(guildsList) as RESTAPIPartialCurrentUserGuild[];
}

/**
 * Deletes all entries in the userGuildsStore that end with the specified userId.
 *
 * @param userId - The ID of the user whose guild entries should be deleted.
 */
export function del(userId: string): void {
  const keys = userGuildsStore.keys().filter((key) => key.endsWith(userId));
  userGuildsStore.del(keys);
}
