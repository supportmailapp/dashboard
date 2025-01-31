import type { APIUser } from "discord-api-types/v10";
import NodeCache from "node-cache";

const userCache = new NodeCache({
  stdTTL: 600,
  checkperiod: 30,
  errorOnMissing: false,
});

export function set(user: APIUser) {
  userCache.set(user.id, user);
}

export function get(userId: string) {
  return userCache.get(userId) as APIUser;
}

export function del(userId: string) {
  userCache.del(userId);
}
