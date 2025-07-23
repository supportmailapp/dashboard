import type { APIGuildMember } from "discord-api-types/v10";
import NodeCache from "node-cache";

const members = new NodeCache({
  stdTTL: 300,
  errorOnMissing: false,
  useClones: false,
});

function buildKey(
  type: "member" | "search-result",
  {
    guildId,
    userId,
    query,
  }: {
    guildId: string;
    userId?: string;
    query?: string;
  },
) {
  if (type === "search-result") {
    return `search-result:${guildId}:${encodeURIComponent(query ?? "")}`;
  }

  return `${type}:${guildId}:${userId}`;
}

function setMember(guildId: string, userId: string, data: APIGuildMember) {
  return members.set<APIGuildMember>(buildKey("member", { guildId, userId }), data);
}

function getMember(guildId: string, userId: string) {
  return members.get<APIGuildMember>(buildKey("member", { guildId, userId }));
}

function takeMember(guildId: string, userId: string) {
  return members.take<APIGuildMember>(buildKey("member", { guildId, userId }));
}

function delMember(guildId: string, userId: string) {
  return members.del(buildKey("member", { guildId, userId }));
}

function setSearchResult(guildId: string, query: string, data: APIGuildMember[]) {
  return members.set<APIGuildMember[]>(buildKey("search-result", { guildId, query }), data, 60);
}

function getSearchResult(guildId: string, query: string) {
  return members.get<APIGuildMember[]>(buildKey("search-result", { guildId, query }));
}

function delSearchResult(guildId: string, query: string) {
  return members.del(buildKey("search-result", { guildId, query }));
}

export default {
  get: getMember,
  set: setMember,
  take: takeMember,
  del: delMember,
  getSearchResult,
  setSearchResult,
  delSearchResult,
};
