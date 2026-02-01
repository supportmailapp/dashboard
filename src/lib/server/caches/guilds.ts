// Caches roles and channels for guilds

import type { APIRole, APIThreadChannel } from "discord-api-types/v10";
import NodeCache from "node-cache";

const cache = new NodeCache({
  stdTTL: 600,
  checkperiod: 60,
  useClones: false,
  errorOnMissing: false,
});

const nonExistingChannels = new NodeCache({ stdTTL: 300, useClones: false });

const cacheKey = (guildId: string, typ: "roles" | "channels" | "channel", channelId: string = "") => {
  if (channelId) return `${guildId}:${typ}:${channelId}` as const;
  return `${guildId}:${typ}` as const;
};

export function setGuildCache(
  guildId: string,
  data: { roles?: APIRole[]; channels?: GuildCoreChannel[]; channel?: GuildCoreChannel | APIThreadChannel },
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

export function getGuildRoles(guildId: string): APIRole[] | undefined {
  return cache.get<APIRole[]>(cacheKey(guildId, "roles"));
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
  cache.del(cacheKey(guildId, "channel"));
}

export function clearAllGuildCaches() {
  cache.del(cache.keys());
}

// Non existing channels cache

export function setNonExistingChannel(guildId: string, channelId: string) {
  return nonExistingChannels.set(`${guildId}:${channelId}`, true);
}

export function isNonExistingChannel(guildId: string, channelId: string) {
  return nonExistingChannels.has(`${guildId}:${channelId}`);
}

export function delNonExistingChannel(guildId: string, channelId: string) {
  return nonExistingChannels.del(`${guildId}:${channelId}`);
}

export function clearAllNonExistingChannels() {
  nonExistingChannels.del(nonExistingChannels.keys());
}
