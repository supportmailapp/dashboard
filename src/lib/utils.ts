import { clsx, type ClassValue } from "clsx";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;

export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
  ref?: U | null;
};

type ParseIconEndpoint = "guild" | "user" | "banner" | "avatarDecoration";

export function parseIconToURL(
  icon_hash: string | null | undefined,
  id: string,
  endpoint?: ParseIconEndpoint,
  size?: number,
): string | undefined;
export function parseIconToURL(
  icon_hash: string | null | undefined,
  id: string,
  endpoint: "user",
  size?: number,
): string;
export function parseIconToURL(
  icon_hash: string,
  id: string,
  endpoint: "avatarDecoration",
  size?: number,
): string;

export function parseIconToURL(
  icon_hash: string | null | undefined,
  id: string,
  endpoint: "guild" | "user" | "banner" | "avatarDecoration" = "guild",
  size: number = 512,
) {
  if (!icon_hash && endpoint !== "user") return undefined;

  if (endpoint === "user" && !icon_hash) {
    return `https://cdn.discordapp.com/embed/avatars/${(Number(id) >> 22) % 6}.png`;
  }
  if (!icon_hash) {
    return undefined;
  }

  const Routes = {
    guild: "icons/",
    user: "avatars/",
    banner: "banners/",
    avatarDecoration: "avatar-decoration-presets/",
  } as const;

  if (endpoint === "avatarDecoration") {
    return `https://cdn.discordapp.com/${Routes[endpoint]}${icon_hash}?size=${size}`;
  }

  const suffix = icon_hash.startsWith("a_") ? "gif" : "webp";
  return "https://cdn.discordapp.com/" + Routes[endpoint] + `${id}/${icon_hash}.${suffix}?size=${size}`;
}

export function relativeDatetime(djs: dayjs.ConfigType): string {
  return dayjs(djs).fromNow();
}

export function isNotUndefined<T>(val: T): val is Exclude<T, undefined> {
  return typeof val !== "undefined";
}

export function hasAllKeys<K extends string>(obj: any, keys: readonly K[]): obj is Record<K, any> {
  return typeof obj === "object" && !!obj && keys.every((key) => key in obj);
}

/**
 * Attempts to parse a string as an integer with validation and clamping.
 *
 * @param str - The string to parse as an integer
 * @param _defaultValue - The value to return if parsing fails or validation fails
 * @param max - The maximum allowed value (inclusive)
 * @param min - The minimum allowed value (inclusive), defaults to 1
 * @returns The parsed integer clamped to the range [min, max], or the default value if parsing fails
 *
 * @example
 * ```typescript
 * tryToParseInt("42", 0, 100, 1); // Returns 42
 * tryToParseInt("150", 0, 100, 1); // Returns 100 (clamped to max)
 * tryToParseInt("abc", 0, 100, 1); // Returns 0 (default value)
 * tryToParseInt("0", 10, 100, 1); // Returns 1 (clamped to min)
 * tryToParseInt("xyz", 2, 100, 1); // Returns 2 (default value, whitespace input)
 * ```
 */
export function safeParseInt(str: unknown, _defaultValue: number, min = 1, max?: number): number {
  try {
    if (typeof str !== "string") {
      return _defaultValue; // Return default value if input is not a string
    }
    const num = parseInt(str, 10); // Always specify radix

    // Check if parsing failed or string wasn't purely numeric
    if (isNaN(num) || !str.trim() || !/^\d+$/.test(str.trim())) {
      return _defaultValue;
    }

    // Clamp the value to the range [min, max] (if max is provided)
    return Math.max(min, max !== undefined ? Math.min(max, num) : num);
  } catch {
    return _defaultValue;
  }
}
