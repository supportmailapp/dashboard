// Caches roles and channels for guilds

import NodeCache from "node-cache";

const cache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  useClones: false,
  errorOnMissing: false,
});

const cacheKey = (guildId: string, typ: "roles" | "channels") => `${guildId}:${typ}`;

export function setGuildCache(guildId: string, data: { roles?: GuildRole[]; channels?: GuildCoreChannel[] }) {
  if (!guildId || !data) return;
  if (data.roles) {
    cache.set(cacheKey(guildId, "roles"), data.roles);
  }
  if (data.channels) {
    cache.set(cacheKey(guildId, "channels"), data.channels);
  }
  if (data.roles || data.channels) {
    return true;
  }
  return false;
}

export function getGuildRoles(guildId: string): GuildRole[] | undefined {
  return cache.get<GuildRole[]>(cacheKey(guildId, "roles"));
}

export function getGuildChannels(guildId: string): GuildCoreChannel[] | undefined {
  return cache.get<GuildCoreChannel[]>(cacheKey(guildId, "channels"));
}

export function clearGuildCache(guildId: string) {
  cache.del(cacheKey(guildId, "roles"));
  cache.del(cacheKey(guildId, "channels"));
}

export function clearAllGuildCaches() {
  cache.del(cache.keys());
}
