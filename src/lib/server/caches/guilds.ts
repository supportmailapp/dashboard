// Caches roles and channels for guilds

import type { APIThreadChannel } from "discord-api-types/v10";
import NodeCache from "node-cache";

const cache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  useClones: false,
  errorOnMissing: false,
});

const cacheKey = (guildId: string, typ: "roles" | "channels" | "channel", channelId = "") => {
  if (channelId) return `${guildId}:${typ}:${channelId}` as const;
  return `${guildId}:${typ}` as const;
};

export function setGuildCache(
  guildId: string,
  data: { roles?: GuildRole[]; channels?: GuildCoreChannel[]; channel?: GuildCoreChannel | APIThreadChannel },
) {
  if (!guildId || !data) return;
  if (data.roles) {
    cache.set(cacheKey(guildId, "roles"), data.roles);
  }
  if (data.channels) {
    cache.set(cacheKey(guildId, "channels"), data.channels);
  }
  if (data.channel) {
    cache.set(cacheKey(guildId, "channel"), data.channel);
  }
  if (data.roles || data.channels) {
    return true;
  }
  return false;
}

/**
 * Used for caching specific channels in a guild, which are not in the main channels list (because maybe they are threads or posts)
 */
export function setChannelCache(guildId: string, channel: GuildCoreChannel | APIThreadChannel) {
  return cache.set(cacheKey(guildId, "channel", channel.id), channel);
}

export function getGuildRoles(guildId: string): GuildRole[] | undefined {
  return cache.get<GuildRole[]>(cacheKey(guildId, "roles"));
}

export function getGuildChannels(guildId: string): GuildCoreChannel[] | undefined {
  return cache.get<GuildCoreChannel[]>(cacheKey(guildId, "channels"));
}

export function getGuildChannel(
  guildId: string,
  channelId: string,
): GuildCoreChannel | APIThreadChannel | undefined {
  return cache.get<GuildCoreChannel | APIThreadChannel>(cacheKey(guildId, "channel", channelId));
}

export function clearGuildCache(guildId: string) {
  cache.del(cacheKey(guildId, "roles"));
  cache.del(cacheKey(guildId, "channels"));
}

export function clearAllGuildCaches() {
  cache.del(cache.keys());
}
