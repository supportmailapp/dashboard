import { env } from "$env/dynamic/private";
import { cacheToken } from "$lib/cache/users";
import jwt from "jsonwebtoken";

export function createSessionToken(userId: string, accessToken: string): string {
  return jwt.sign({ id: userId, at: accessToken }, env.JWT_SECRET, {
    expiresIn: "1d",
    algorithm: "HS256",
    encoding: "utf-8",
    issuer: "supportmail",
  });
}

/**
 * Validate a session and return the JWT payload or null.
 */
export async function verifySessionToken(token: string): Promise<{ id: string; accessToken: string } | null> {
  try {
    const _token = jwt.verify(token, env.JWT_SECRET, { issuer: "supportmail" }) as jwt.JwtPayload;
    cacheToken(_token.id, _token.at);
    return { id: _token.id, accessToken: _token.at };
  } catch (e) {
    return null;
  }
}
