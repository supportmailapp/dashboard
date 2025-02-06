import NodeCache from "node-cache";

const BASE_CACHE_OPTS: NodeCache.Options = {
  stdTTL: 3600,
  checkperiod: 60,
  errorOnMissing: false,
} as const;

const guildsStore = new NodeCache(BASE_CACHE_OPTS);

const guildRolesStore = new NodeCache(BASE_CACHE_OPTS);

const userGuildsStore = new NodeCache({ ...BASE_CACHE_OPTS, stdTTL: 1800 });

function buildKey(typ: string, guildId: string): `${string}:${string}` {
  return `${typ}:${guildId}`;
}

export function parseToCacheGuild(guild: any, configured = false): CachableGuild {
  return {
    id: guild.id,
    name: guild.name,
    iconHash: guild.icon || guild.iconHash,
    isConfigured: guild.isConfigured || configured,
    permissions: String(guild.permissions),
  };
}

// * Store object data stringified, because Objects have a higher memory footprint and the obejcts are relatively small.

// Setters //
export function setGuilds(...guilds: CachableGuild[]): void {
  guildsStore.mset(guilds.map((guild) => ({ key: guild.id, val: JSON.stringify(guild) })));
}

export function overwriteUserGuilds(userId: string, guildIds: string[]): void {
  userGuildsStore.set(userId, guildIds);
}

export function setGuildRoles(guildId: string, roles: BasicRole[]): void {
  guildsStore.set(buildKey("roles", guildId), JSON.stringify(roles));
}

export function setGuildChannels(guildId: string, channels: BasicChannel[]): void {
  guildsStore.set(buildKey("channels", guildId), JSON.stringify(channels));
}

// Getters //
export function getGuild(id: string): CachableGuild | null {
  const guild = guildsStore.get(id) as any;
  if (!guild) return null;
  return JSON.parse(guild);
}

export function getGuildRoles(guildId: string): BasicRole[] | null {
  const roles = guildsStore.get(buildKey("roles", guildId)) as any;
  if (!roles) return null;
  return JSON.parse(roles);
}

export function getGuildChannels(guildId: string): BasicChannel[] | null {
  const channels = guildsStore.get(buildKey("channels", guildId)) as any;
  if (!channels) return null;
  return JSON.parse(channels);
}

export function getUserGuilds(userId: string): CachableGuild[] | null {
  const guildIds = userGuildsStore.get<string[]>(userId);
  if (!guildIds) return null;
  const guilds = guildsStore.mget<string>(guildIds);
  if (!guilds) return null;
  return Object.values(guilds).map((guild) => JSON.parse(guild));
}

// Deleters //
export function delGuild(id: string): void {
  guildsStore.del(id);
}

export function delGuildRoles(guildId: string): void {
  guildsStore.del(buildKey("roles", guildId));
}

export function delGuildChannels(guildId: string): void {
  guildsStore.del(buildKey("channels", guildId));
}

export function delUserGuilds(userId: string): void {
  userGuildsStore.del(userId);
}

// Clearers //
export function clearGuilds(): void {
  guildsStore.flushAll();
}

export function clearGuildRoles(): void {
  guildRolesStore.flushAll();
}

export function clearGuildChannels(): void {
  guildsStore.flushAll();
}

export function clearUserGuilds(): void {
  userGuildsStore.flushAll();
}

export function clearAll(): void {
  guildsStore.flushAll();
  guildRolesStore.flushAll();
  guildsStore.flushAll();
  userGuildsStore.flushAll();
}
