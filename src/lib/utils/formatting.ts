import { DISCORD_CDN_BASE } from "$lib/constants";
import type { APIRole } from "discord-api-types/v10";

/**
 * Sorts an array of items by their position property in ascending order.
 * If two items have the same position, they are sorted by their id property in lexicographical order.
 *
 * @template T - The type of the objects, which must include `id` and `position` properties.
 * @param {T[]} items - The array of items to be sorted.
 * @returns {T[]} A new array of items sorted by position and id.
 */
export function sortByPositionAndId<T extends { id: string; position: number }>(items: T[]): T[] {
  return items.slice().sort((a, b) => {
    if (a.position === b.position) {
      return a.id.localeCompare(b.id);
    }
    return a.position - b.position;
  });
}

/**
 * Converts an APDCGuildCoreChannel object to a PartialChannel object.
 *
 * @param channel - The APDCGuildCoreChannel object to convert.
 * @returns A PartialChannel object with selected properties from the input channel.
 */
export function apiChannelToBasic(channel: GuildCoreChannel): BasicChannel {
  return {
    id: channel.id,
    name: channel.name,
    position: channel.position,
    type: channel.type,
    parentId: channel.parent_id || null,
  };
}

/**
 * Converts an APIRole object to a PartialRole object.
 *
 * @param role - The APIRole object to convert.
 * @returns A PartialRole object containing selected properties from the APIRole.
 */
export function apiRoleToBasic(role: APIRole): BasicRole {
  return {
    id: role.id,
    name: role.name,
    color: role.color,
    position: role.position,
    permissions: role.permissions,
    managed: role.managed,
  };
}

type AnyUser = {
  id: string;
  username: string;
  displayName?: string | null;
  global_name?: string | null;
  avatar: string | null;
};

export function anyUserToBasic(user: AnyUser): BasicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? user.global_name ?? user.username ?? null,
    avatar: user.avatar,
  };
}

export const cdnUrls = {
  guildIcon: (guildId: string, icon: string | null, size: number | string = "512") =>
    DISCORD_CDN_BASE + (icon ? `/icons/${guildId}/${icon}.webp?size=${size}` : `/embed/avatars/1.png`),
  userAvatar: (userId: string, avatar: string | null, size: number | string = "512") =>
    DISCORD_CDN_BASE +
    (avatar ? `/avatars/${userId}/${avatar}.webp?size=${size}` : `/embed/avatars/${(Number(userId) >> 22) % 6}.png`),
};

export function numberToHex(number: number): string {
  return number.toString(16).padStart(6, "0");
}

export function hexToNumber(hex: string): number {
  return parseInt(hex, 16);
}

export function clipTextToLength(text: string, maxLength: number = 30): string {
  return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");
}
