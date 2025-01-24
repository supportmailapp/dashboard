import type { APIGuildChannel, APIPartialGuild, APIRole, APIUser, GuildChannelType } from "discord-api-types/v10";

export function apiUserToCurrentUser(apiUser: APIUser): Utils.CurrentUser {
  return {
    id: apiUser.id,
    username: apiUser.username,
    displayName: apiUser.global_name || apiUser.username,
    avatarHash: apiUser.avatar || null,
  };
}

export function apiPartialGuildToPartialGuild(apiGuild: APIPartialGuild): Utils.PartialGuild {
  return {
    id: apiGuild.id,
    name: apiGuild.name,
    iconHash: apiGuild.icon || null,
  };
}

export function apiPartialGuildToCurrentGuild(
  apiGuild: APIPartialGuild | Utils.PartialGuild,
  channels: APIGuildChannel<GuildChannelType>[],
  roles: APIRole[],
): Utils.CurrentGuild {
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
