// Private utility stuff for Discord-related operations

import { env } from "$env/dynamic/private";
import { REST } from "@discordjs/rest";
import { Routes, type APIRole } from "discord-api-types/v10";

export class DiscordREST {
  private readonly rest: REST;
  constructor() {
    this.rest = new REST({ version: "10" }).setToken(env.discordBotToken);
  }

  public get instance(): REST {
    return this.rest;
  }

  public async getGuildChannels(guildId: string): Promise<GuildCoreChannel[]> {
    return this.rest.get(Routes.guildChannels(guildId)) as any;
  }

  public async getGuildRoles(guildId: string): Promise<APIRole[]> {
    return this.rest.get(Routes.guildRoles(guildId)) as any;
  }
}
