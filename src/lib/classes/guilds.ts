class BasicGuild implements BaseGuild {
  id: string;
  name: string;
  iconHash: string | null;
  isConfigured: boolean;

  constructor(id: string, name: string, iconHash: string | null, isConfigured: boolean) {
    this.id = id;
    this.name = name;
    this.iconHash = iconHash;
    this.isConfigured = isConfigured;
  }
}

class ActiveGuild extends BasicGuild implements IActiveGuild {
  public roles: BasicRole[];
  public channels: BasicChannel[];

  constructor(id: string, name: string, iconHash: string | null, isConfigured: boolean) {
    super(id, name, iconHash, isConfigured);
    this.roles = [];
    this.channels = [];
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
