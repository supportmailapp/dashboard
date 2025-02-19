import NodeCache from "node-cache";
import type { IDBGuild } from "supportmail-types";

const cache = new NodeCache({ stdTTL: 60, errorOnMissing: false });

export function setConfig(guildId: string, config: IDBGuild) {
  return cache.set(guildId, config);
}

export function getConfig(guildId: string) {
  return cache.get<IDBGuild>(guildId);
}

export function deleteConfig(guildId: string) {
  return cache.del(guildId);
}

export function clearCache() {
  return cache.flushAll();
}
