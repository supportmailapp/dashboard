// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { APIChannel, APIDMChannel, APIGroupDMChannel, APIThreadChannel, ChannelType } from "discord-api-types/v10";

declare global {
  namespace App {
    interface Error {
      errorId?: string;
      message?: string;
      status?: number;
      details?: any;
    }

    interface Locals {
      guilds?: DCGuild[];
      guild?: DCGuild | null;
      user: BasicUser | null;
      /**
       * Just for the API routes.
       */
      guildId?: string;
      /**
       * Just for the API routes.
       */
      token?: string;
    }

    interface PageData {
      user: BasicUser;
      guilds?: DCGuild[] | null;
      guildId?: string;
      guild?: DCGuild | null;
      roles?: BasicRole[];
      channels?: BasicChannel[];
      status?: number;
      redirect?: string;
      ccDate: string;
      basePath: string;
      configData: any;
    }

    // interface PageState {}

    // interface Platform {}
  }

  type BasicRole = {
    id: string;
    name: string;
    /** Integer representation of hexadecimal color code */
    color: number;
    position: number;
    permissions: string; // ? Is this needed?
  };

  type BasicChannel = {
    id: string;
    name: string;
    type: ChannelType;
    position: number;
    parentId: string?;
  };

  /**
   * Represents a guild (server) in the application.
   */
  type DCGuild = {
    /**
     * The snowflake of the guild.
     */
    id: string;
    /**
     * The name of the guild.
     */
    name: string;
    /**
     * The hash of the guild's icon, or null if no icon is set.
     *
     * If not given, `/embeds/`
     */
    iconHash: string | null;
    /**
     * Indicates whether the guild is configured.
     */
    isConfigured: boolean;
    /**
     * The permissions associated with the guild.
     */
    permissions: number | bigint | string;
  };

  type CachableGuild = Omit<DCGuild, "permissions"> & { permissions: string };

  type BasicUser = {
    id: string;
    username: string;
    displayName: string;
    avatar: string?;
  };

  /**
   * An API guild channel which is not a thread.
   */
  type GuildCoreChannel = Exclude<APIChannel, APIDMChannel | APIGroupDMChannel | APIThreadChannel>;

  type JWTData = {
    userId: string;
  };

  type AppPlugin = {
    /**
     * The slug of the plugin. Starts with a slash.
     */
    slug: string;
    name: string;
    description?: string;
    iconUrl: string;
    isNew?: true;
  };

  type NavItem = AppPlugin;
}

export {};
