import type { APIGuildMember } from "discord-api-types/v10";
import NodeCache from "node-cache";

const memberCache = new NodeCache({
  stdTTL: 60,
  checkperiod: 30,
  errorOnMissing: false,
});

const buildKey = (guildId: string, memberId: string) => `${guildId}:${memberId}`;

export function getMember(guildId: string, memberId: string): APIGuildMember | undefined {
  return memberCache.get(buildKey(guildId, memberId));
}

export function setMember(guildId: string, member: APIGuildMember) {
  return memberCache.set(buildKey(guildId, member.user.id), member);
}

export function delMember(guildId: string, memberId: string) {
  return memberCache.del(buildKey(guildId, memberId));
}

export function delGuild(guildId: string) {
  const keys = memberCache.keys().filter((key) => key.startsWith(guildId));
  memberCache.del(keys);
}

export function delMemberGuilds(memberId: string) {
  const keys = memberCache.keys().filter((key) => key.endsWith(memberId));
  memberCache.del(keys);
}

export function delAll() {
  return memberCache.flushAll();
}

export function getStats() {
  return memberCache.getStats();
}
