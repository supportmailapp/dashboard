import type { RESTAPIPartialCurrentUserGuild } from "discord-api-types/v10";

class BasicGuild implements BaseGuild {
  public readonly id: string;
  public readonly name: string;
  public readonly iconHash: string | null;
  public isConfigured: boolean;
  public readonly permissions: number | bigint;

  constructor(id: string, name: string, iconHash: string | null, isConfigured: boolean, permissions: number | bigint) {
    this.id = id;
    this.name = name;
    this.iconHash = iconHash;
    this.isConfigured = isConfigured;
    this.permissions = permissions;
  }

  public static from(guild: RESTAPIPartialCurrentUserGuild, configured: boolean = false): BasicGuild {
    return new BasicGuild(guild.id, guild.name, guild.icon, configured, Number(guild.permissions));
  }

  public setConfigured(configured: boolean): BasicGuild {
    this.isConfigured = configured;
    return this;
  }
}

class ActiveGuild extends BasicGuild implements IActiveGuild {
  public roles: BasicRole[];
  public channels: BasicChannel[];

  constructor(id: string, name: string, iconHash: string | null, isConfigured: boolean, permissions: number | bigint) {
    super(id, name, iconHash, isConfigured, permissions);
    this.roles = [];
    this.channels = [];
  }

  public static override from(guild: RESTAPIPartialCurrentUserGuild | BaseGuild, configured: boolean = false): ActiveGuild {
    const iconHash = "icon" in guild ? guild.icon : guild.iconHash;
    return new ActiveGuild(guild.id, guild.name, iconHash, configured, Number(guild.permissions));
  }

  setRoles(roles: BasicRole[]): ActiveGuild {
    this.roles = roles;
    return this;
  }

  setChannels(channels: BasicChannel[]): ActiveGuild {
    this.channels = channels;
    return this;
  }
}

export { BasicGuild, ActiveGuild };
