import type { RESTAPIPartialCurrentUserGuild } from "discord-api-types/v10";
import NodeCache from "node-cache";

// All the BasicGuilds currently in the cache
const guildsCache = new NodeCache({
  stdTTL: 900,
  checkperiod: 30,
  errorOnMissing: false,
});

type GuildsCacheValue = RESTAPIPartialCurrentUserGuild | undefined;

// Maps a user ID to an array of guilds the user is in and an array of guilds the user has configured
// Format: `{accessToken}-{userId}` -> { guildIds: string[], configured: string[] }
const userGuildsStore = new NodeCache({
  stdTTL: 600,
  checkperiod: 30,
  errorOnMissing: false,
});

type UserGuildsMappingValue = {
  guildIds: string[];
  configured: string[];
};

function buildUserKey(userId: string, accessToken: string): string {
  return `${userId}:${accessToken}`;
}

/**
 * Sets the user's guilds in the userGuildsStore and caches the guilds in the guildsCache.
 *
 * @param userId - The ID of the user.
 * @param accessToken - The access token of the user.
 * @param guilds - An array of partial guild objects associated with the user.
 */
export function setUserWithGuilds(
  userId: string,
  accessToken: string,
  guilds: RESTAPIPartialCurrentUserGuild[],
  configured: string[] | null = null,
): void {
  const userKey = buildUserKey(userId, accessToken);
  const userGuildsData = userGuildsStore.get<UserGuildsMappingValue>(userKey);

  userGuildsStore.set(userKey, {
    guildIds: guilds.map((g) => g.id),
    configured: configured ?? userGuildsData?.configured ?? [],
  });

  guildsCache.mset(
    guilds.map((guild) => ({
      key: guild.id,
      val: guild,
    })),
  );
}

type GetUserGuildsResult = {
  guilds: RESTAPIPartialCurrentUserGuild[];
  configured: string[];
};

/**
 * Retrieves the guilds associated with the user from the cache.
 *
 * @param userId - The unique identifier of the user.
 * @param accessToken - The access token of the user.
 * @param guildIds - An array of partial guild objects representing the guilds the user is a member of.
 */
export function getUserGuilds(userId: string, accessToken: string): GetUserGuildsResult | null {
  const userGuildsData = userGuildsStore.get<UserGuildsMappingValue>(buildUserKey(userId, accessToken));
  if (!userGuildsData) {
    return null;
  }

  const guildsList = guildsCache.mget<GuildsCacheValue | undefined>(userGuildsData.guildIds);
  if (!guildsList || Object.values(guildsList).length != userGuildsData.guildIds.length) {
    return null; // If any of the guilds are missing, return null to fetch the user's guilds again
  }

  return {
    guilds: Object.values(guildsList) as RESTAPIPartialCurrentUserGuild[],
    configured: userGuildsData.configured,
  };
}

export function updateGuilds(guilds: RESTAPIPartialCurrentUserGuild[]): void {
  guildsCache.mset(
    guilds.map((guild) => ({
      key: guild.id,
      val: guild,
    })),
  );
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
