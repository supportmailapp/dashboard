import { env } from "$env/dynamic/private";
import { getUser } from "$lib/cache/users";
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";

export function createSessionToken(userId: string): string {
  return jwt.sign({ id: userId, shh: randomBytes(16).toString("base64") }, env.JWT_SECRET, {
    expiresIn: "1d",
    algorithm: "HS256",
    encoding: "utf-8",
    issuer: "supportmail",
  });
}

/**
 * Validate a session and return the user if it exists.
 */
export async function verifySessionToken(token: string): Promise<BasicUser | null> {
  try {
    const { id: userId } = jwt.verify(token, env.JWT_SECRET, { issuer: "supportmail" }) as any;
    return getUser(userId);
  } catch (e) {
    return null;
  }
}
