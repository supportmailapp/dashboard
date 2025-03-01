import NodeCache from "node-cache";

const userCache = new NodeCache({
  stdTTL: 10_800,
  checkperiod: 60,
  errorOnMissing: false,
});

const tokenCache = new NodeCache({
  stdTTL: 10_800,
  checkperiod: 60,
  errorOnMissing: false,
});

// Setters //
export function cacheUser(userId: string, data: BasicUser): void {
  userCache.set<string>(userId, JSON.stringify(data));
}

export function cacheToken(userId: string, token: string): void {
  tokenCache.set<string>(userId, token);
}

// Getters //
export function getUser(userId: string): BasicUser | null {
  const cached = userCache.get<string>(userId);
  if (!cached) return null;

  return JSON.parse(cached);
}

export function getToken(userId: string): string | null {
  return tokenCache.get<string>(userId) || null;
}

// Deleters //
export function removeUser(userId: string) {
  userCache.del(userId);
}

export function removeToken(userId: string) {
  tokenCache.del(userId);
}

// Clearers //
export function clearUsers() {
  userCache.flushAll();
}

export function clearTokens() {
  tokenCache.flushAll();
}
