import type { APIUser } from "discord-api-types/v10";

const users = $state<Record<string, APIUser>>({});

export function setCachedUser(user: APIUser): void {
  users[user.id] = user;
}

export function getCachedUser(id: string): APIUser | null {
  return id in users ? $state.snapshot(users[id]) : null;
}
