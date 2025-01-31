import type { RESTAPIPartialCurrentUserGuild } from "discord-api-types/v10";

class Guild {
  public readonly id: string;
  public readonly name: string;
  public readonly iconHash: string | null;
  public isConfigured: boolean;
  public readonly permissions: number | bigint;
  public roles?: BasicRole[];
  public channels?: BasicChannel[];

  constructor(
    id: string,
    name: string,
    iconHash: string | null,
    isConfigured: boolean,
    permissions: number | bigint,
    roles?: BasicRole[],
    channels?: BasicChannel[],
  ) {
    this.id = id;
    this.name = name;
    this.iconHash = iconHash;
    this.isConfigured = isConfigured;
    this.permissions = permissions;
    this.roles = roles || [];
    this.channels = channels || [];
  }

  /**
   * Creates an instance of `Guild` from a given guild object.
   *
   * @param _guild - The guild object, which can be either a RESTAPIPartialCurrentUserGuild or a BaseGuild.
   * @param configured - A boolean indicating whether the guild is configured. Defaults to false.
   * @returns An instance of Guild.
   */
  public static from(_guild: RESTAPIPartialCurrentUserGuild, configured: boolean = false): Guild {
    return new Guild(_guild.id, _guild.name, _guild.icon, configured, Number(_guild.permissions));
  }

  setRoles(roles: BasicRole[]): Guild {
    this.roles = roles;
    return this;
  }

  setChannels(channels: BasicChannel[]): Guild {
    this.channels = channels;
    return this;
  }
}

export { Guild };
