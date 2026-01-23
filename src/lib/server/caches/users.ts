import type { APIUser } from "discord-api-types/v10";
import NodeCache from "node-cache";

const users = new NodeCache({
  stdTTL: 300,
  errorOnMissing: false,
  useClones: false,
});

type SearchResult = APIUser[];

function buildKey(guildId: string, query: string) {
  return `search-result:${guildId}:${encodeURIComponent(query ?? "")}`;
}

function setSearchResult(guildId: string, query: string, data: SearchResult) {
  users.set<SearchResult>(buildKey(guildId, query), data, 60);
}

function getSearchResult(guildId: string, query: string) {
  const _users = users.get<SearchResult>(buildKey(guildId, query));
  return _users;
}

function takeSearchResult(guildId: string, query: string) {
  const _users = users.take<SearchResult>(buildKey(guildId, query));
  return _users;
}

function delSearchResult(guildId: string, query: string) {
  return users.del(buildKey(guildId, query));
}

export default {
  get: getSearchResult,
  set: setSearchResult,
  take: takeSearchResult,
  del: delSearchResult,
};
