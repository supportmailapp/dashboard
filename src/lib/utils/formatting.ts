import { DISCORD_CDN_BASE } from "$lib/constants";
import type { APIRole, APIUser, RESTAPIPartialCurrentUserGuild } from "discord-api-types/v10";

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

export function apiUserToCurrentUser(apiUser: APIUser | null): BaseUser | null {
  if (!apiUser) {
    return null;
  }
  return {
    id: apiUser.id,
    username: apiUser.username,
    displayName: apiUser.global_name || apiUser.username,
    avatarHash: apiUser.avatar || null,
  };
}

/**
 * Used for the `guilds` locale.
 */
export function apiPartialGuildToBaseGuild(apiGuild: RESTAPIPartialCurrentUserGuild, isConfigured: boolean = false): IGuild {
  return {
    id: apiGuild.id,
    name: apiGuild.name,
    iconHash: apiGuild.icon || null,
    isConfigured: isConfigured,
    permissions: BigInt(apiGuild.permissions),
  };
}

/**
 * Converts an APIGuildCoreChannel object to a PartialChannel object.
 *
 * @param channel - The APIGuildCoreChannel object to convert.
 * @returns A PartialChannel object with selected properties from the input channel.
 */
export function apiChannelToPartial(channel: APIGuildCoreChannel): BasicChannel {
  return {
    id: channel.id,
    name: channel.name || "undefined",
    position: channel.position,
    type: channel.type,
  };
}

/**
 * Converts an APIRole object to a PartialRole object.
 *
 * @param role - The APIRole object to convert.
 * @returns A PartialRole object containing selected properties from the APIRole.
 */
export function apiRoleToPartial(role: APIRole): BasicRole {
  return {
    id: role.id,
    name: role.name,
    color: role.color,
    position: role.position,
    permissions: role.permissions,
  };
}

export const cdnUrls = {
  guildIcon: (guildId: string, icon: string | null, size = "512") =>
    DISCORD_CDN_BASE + (icon ? `/icons/${guildId}/${icon}.webp?size=${size}` : `/embed/avatars/1.png`),
  userAvatar: (userId: string, avatar: string | null, size = "512") =>
    DISCORD_CDN_BASE +
    (avatar ? `/avatars/${userId}/${avatar}.webp?size=${size}` : `/embed/avatars/${(Number(userId) >> 22) % 6}.png`),
};
