// Private utility functions for Discord-related operations

/**
 *
 * @param state UTF-8 encoded session state
 * @returns Base64 encoded session state
 */
export function generateSessionId(): string {
  return Buffer.from(crypto.randomUUID(), "utf-8").toString("base64");
}

/**
 *
 * @param encoded Base64v encoded session state
 * @returns UTF-8 decoded session state
 */
export function decodeSessionId(encoded: string): string {
  return Buffer.from(encoded, "base64").toString("utf-8");
}
