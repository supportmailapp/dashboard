const users = $state<Record<string, BasicUser>>({});

export function setCachedUser(user: BasicUser) {
  users[user.id] = user;
}

export function getCachedUser(id: string): BasicUser | null {
  return id in users ? $state.snapshot(users[id]) : null;
}
