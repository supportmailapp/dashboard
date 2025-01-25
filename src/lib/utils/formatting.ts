import type { APIGuildChannel, APIPartialGuild, APIRole, APIUser, GuildChannelType } from "discord-api-types/v10";

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
export function apiPartialGuildToPartialGuild(apiGuild: APIPartialGuild): PartialGuild {
  return {
    id: apiGuild.id,
    name: apiGuild.name,
    iconHash: apiGuild.icon || null,
  };
}

/**
 * Used for the `currentGuild` locale.
 */
export function apiPartialGuildToCurrentGuild(
  apiGuild: APIPartialGuild | PartialGuild,
  channels: APIGuildChannel<GuildChannelType>[],
  roles: APIRole[],
): CurrentGuild {
  const iconHash = "icon" in apiGuild ? apiGuild.icon : apiGuild.iconHash || null;
  return {
    id: apiGuild.id,
    name: apiGuild.name,
    iconHash: iconHash,
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
