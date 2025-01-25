import { DISCORD_CDN_BASE } from "$lib/constants";
import type { APIGuildChannel, RESTAPIPartialCurrentUserGuild, APIRole, APIUser, GuildChannelType } from "discord-api-types/v10";

export function apiUserToCurrentUser(apiUser: APIUser): CurrentUser {
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
export function apiPartialGuildToPartialGuild(
  apiGuild: RESTAPIPartialCurrentUserGuild,
  isConfigured: boolean = false,
): PartialGuild {
  return {
    id: apiGuild.id,
    name: apiGuild.name,
    iconHash: apiGuild.icon || null,
    isConfigured: isConfigured,
  };
}

/**
 * Used for the `currentGuild` locale.
 */
export function apiPartialGuildToCurrentGuild(
  apiGuild: RESTAPIPartialCurrentUserGuild | PartialGuild,
  channels: APIGuildChannel<GuildChannelType>[],
  roles: APIRole[],
): CurrentGuild {
  const iconHash = "icon" in apiGuild ? apiGuild.icon : apiGuild.iconHash || null;
  return {
    id: apiGuild.id,
    name: apiGuild.name,
    iconHash: iconHash,
    isConfigured: true,
    // TODO: Implement sorting after position, if same position, sort by ID, return new array with adjusted positions
    channels: channels.map((channel) => ({
      id: channel.id,
      name: channel.name || "unknown",
      type: channel.type,
      position: channel.position,
    })),
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      color: role.color,
      position: role.position,
    })),
  };
}

export const cdnUrls = {
  guildIcon: (guildId: string, icon: string | null) =>
    DISCORD_CDN_BASE + (icon ? `/icons/${guildId}/${icon}.png` : `/embed/avatars/1.png`),
  userAvatar: (userId: string, avatar: string | null) =>
    DISCORD_CDN_BASE + (avatar ? `/avatars/${userId}/${avatar}.png` : `/embed/avatars/${(Number(userId) >> 22) % 6}.png`),
};
