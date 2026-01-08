import { clsx, type ClassValue } from "clsx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import equal from "fast-deep-equal/es6";
import { twMerge } from "tailwind-merge";
import { DiscordSnowflake } from "@sapphire/snowflake";
import { ChannelType } from "discord-api-types/v10";

dayjs.extend(relativeTime);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

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

export function makeFallbackInitials(name: string, maxLength = 2): string {
  if (!name) return "??";
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, maxLength)
    .join("")
    .toUpperCase();
  return initials.length < maxLength ? initials.padEnd(maxLength, "?") : initials;
}

/**
 * Custom deep clone function that handles objects that cannot be structured cloned.
 * Properly handles primitives, Dates, Arrays, and POJOs.
 */
export function deepClone<T>(obj: T): T {
  // Handle null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return new String(obj) as unknown as T;
  }
  if (typeof obj === "number") {
    return new Number(obj) as unknown as T;
  }
  if (typeof obj === "boolean") {
    return new Boolean(obj) as unknown as T;
  }
  if (typeof obj === "bigint") {
    return BigInt(obj.toString()) as unknown as T;
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  // Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as T; // a little bit of that recursion
  }

  // Try structuredClone first for complex objects
  try {
    return structuredClone(obj);
  } catch (error) {
    // Fallback for objects that can't be structured cloned
    try {
      // Handle plain objects with JSON serialization
      if (obj.constructor === Object || obj.constructor === undefined) {
        return JSON.parse(JSON.stringify(obj));
      }

      // For other object types, try to create a new object and copy properties
      const cloned = {} as T;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          (cloned as any)[key] = deepClone((obj as any)[key]);
        }
      }
      return cloned;
    } catch (jsonError) {
      // If all else fails, return the original object
      console.warn("Failed to clone object, returning original:", jsonError);
      return obj;
    }
  }
}

export function sanitizeTagName(str: string) {
  // 1+ spaces -> 1 space + trim
  // uppercase -> lowercase
  // only a-z0-9_ and space in general (delete everything else)
  // limit to 50 characters
  return str
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9_ ]/g, "")
    .slice(0, 50);
}

/**
 * Determines if there are unsaved changes by comparing two configuration objects.
 *
 * @param cfg1 - The first configuration object to compare (typically the original/saved state)
 * @param cfg2 - The second configuration object to compare (typically the current/modified state)
 * @returns `true` if the configurations differ (unsaved changes exist), `false` if they are equal
 *
 * @remarks
 * This function performs a deep equality check between two objects using the `fast-deep-equal` library.
 * It is commonly used to detect when user modifications need to be saved.
 *
 *
 * **IMPORTANT**
 * When using this function, the `oldCfg` MUST be untracked if it's reactive to not cause unnecessary recomputations.
 *
 * @example
 * ```ts
 * import { untrack } from "svelte";
 * import { determineUnsavedChanges } from "$lib/utils";
 *
 * let oldConfig = { ... };
 * let currentConfig = { ... };
 * let unsavedChanges = $derived(determineUnsavedChanges(untrack(() => oldConfig), currentConfig));
 */
export function determineUnsavedChanges(oldCfg: any, currentCfg: any): boolean {
  return !equal(oldCfg, currentCfg);
}

/**
 * A class for parsing snowflake ids using Discord's snowflake epoch
 *
 * Which is 2015-01-01 at 00:00:00.000 UTC+0, {@linkplain https://discord.com/developers/docs/reference#snowflakes}
 */
export const SnowflakeUtil = DiscordSnowflake as typeof DiscordSnowflake;

/**
 * Type guard to check if a channel is sendable (i.e., can send messages)
 */
export function isChannelSendable(channel: APIGuildChannel): channel is GuildSendableChannel {
  return (
    channel.type === ChannelType.GuildCategory ||
    channel.type === ChannelType.GuildStageVoice ||
    channel.type === ChannelType.AnnouncementThread ||
    channel.type === ChannelType.PublicThread ||
    channel.type === ChannelType.PrivateThread ||
    channel.type === ChannelType.GuildAnnouncement
  );
}

/**
 * Zod Error Message helper
 */
export const zem = (msg: string) => ({ error: msg });

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
