import type { RESTAPIPartialCurrentUserGuild } from "discord.js";
import NodeCache from "node-cache";

const BASE_CACHE_OPTS: NodeCache.Options = {
  stdTTL: 1800,
  checkperiod: 60,
  errorOnMissing: false,
} as const;

const guildsStore = new NodeCache(BASE_CACHE_OPTS);

const guildRolesAndChannelsStore = new NodeCache(BASE_CACHE_OPTS);

const userGuildsStore = new NodeCache(BASE_CACHE_OPTS);

function buildKey(typ: "c" | "r", guildId: string): `${string}:${string}` {
  return `${typ}:${guildId}`;
}

export function parseToCacheGuild(guild: RESTAPIPartialCurrentUserGuild, configured = false): DCGuild {
  return {
    ...guild,
    isConfigured: configured,
  };
}

// * Store object data stringified, because Objects have a higher memory footprint and the obejcts are relatively small.

// Guilds functions
export function cacheGuilds(...guilds: DCGuild[]): void {
  guildsStore.mset(guilds.map((guild) => ({ key: guild.id, val: JSON.stringify(guild) })));
}

export function getDCGuild(id: string): DCGuild | null {
  const guild = guildsStore.get(id) as any;
  if (!guild) return null;
  return JSON.parse(guild);
}

export function delDCGuild(id: string): void {
  guildsStore.del(id);
}

export function clearDCGuilds(): void {
  guildsStore.flushAll();
}

// guild roles functions
export function setGuildRoles(guildId: string, roles: BasicRole[]): void {
  guildRolesAndChannelsStore.set(buildKey("r", guildId), JSON.stringify(roles));
}

export function getGuildRoles(guildId: string): BasicRole[] | null {
  const roles = guildRolesAndChannelsStore.get(buildKey("r", guildId)) as any;
  if (!roles) return null;
  return JSON.parse(roles);
}

export function delGuildRoles(guildId: string): void {
  guildRolesAndChannelsStore.del(buildKey("r", guildId));
}

export function clearGuildRoles(): void {
  guildRolesAndChannelsStore.flushAll();
}

// Guild channels functions
export function setGuildChannels(guildId: string, channels: BasicChannel[]): void {
  guildsStore.set(buildKey("c", guildId), JSON.stringify(channels));
}

export function getGuildChannels(guildId: string): BasicChannel[] | null {
  const channels = guildsStore.get(buildKey("c", guildId)) as any;
  if (!channels) return null;
  return JSON.parse(channels);
}

export function delGuildChannels(guildId: string): void {
  guildsStore.del(buildKey("c", guildId));
}

export function clearGuildChannels(): void {
  guildsStore.flushAll();
}

// userGuildsStore functions
export function overwriteUserGuilds(userId: string, guildIds: string[]): void {
  userGuildsStore.set(userId, guildIds);
}

export function getUserGuilds(userId: string): DCGuild[] | null {
  const guildIds = userGuildsStore.get<string[]>(userId);
  if (!guildIds) return null;
  const guilds = guildsStore.mget<string>(guildIds);
  if (!guilds) return null;
  return Object.values(guilds).map((guild) => JSON.parse(guild));
}

export function delUserGuilds(userId: string): void {
  userGuildsStore.del(userId);
}

export function clearUserGuilds(): void {
  userGuildsStore.flushAll();
}

// All caches
export function clearAll(): void {
  guildsStore.flushAll();
  guildRolesAndChannelsStore.flushAll();
  userGuildsStore.flushAll();
}
