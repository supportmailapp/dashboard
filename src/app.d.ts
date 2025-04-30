// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { ConfigState } from "$lib/stores/DataManager.svelte";
import type {
  APIChannel,
  APIDMChannel,
  APIGroupDMChannel,
  APIThreadChannel,
  APIUser,
  ChannelType,
  RESTAPIPartialCurrentUserGuild,
} from "discord-api-types/v10";
import type { WithId } from "mongodb";
import type { IDBUser } from "supportmail-types";

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
      /**
       * Just for the API routes.
       */
      guildId?: string;
      guild?: DCGuild | null;
      /**
       * Just for the API routes. This is checked before based on the Auth header or "session" cookie. If given, the user is **authenticated**.
       */
      userId?: string;
      /**
       * A Basic User from Discord.
       */
      user: BasicUser | null;
      /**
       * The user's access token. Always given if the user is authenticated.
       */
      token?: string;
      bypassCache?: boolean;
    }

    interface PageData {
      user: BasicUser;
      dbUser: WithId<IDBUser>;
      guilds?: DCGuild[] | null;
      guildId?: string;
      guild?: DCGuild | null;
      roles?: BasicRole[];
      channels?: BasicChannel[];
      status?: number;
      redirect?: string;
      news?: News[];
      ccDate: string;
      basePath: string;
      configData: any;
      dataState: ConfigState;
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
    managed: boolean;
  };

  type BasicChannel = {
    id: string;
    name: string;
    type: ChannelType;
    position: number;
    parentId: string?;
  };

  /** @see {APIUser} */
  type BasicUser = {
    id: string;
    username: string;
    /** global_name or username */
    displayName: string | null;
    avatar: string | null;
  };

  type DCGuild = RESTAPIPartialCurrentUserGuild & {
    isConfigured: boolean;
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

  type RedirectData = {
    /**
     * The path to redirect to.
     *
     * If the `guildId` is given, then the redirect should happen on the base page. If not, after server selection.
     */
    path?: `/${string}`;
    /**
     * The guild ID to redirect to.
     */
    guildId?: string;
  };

  type News = {
    id: string;
    type: "info" | "success" | "warning" | "error";
    title: string;
    content: string;
  };

  /**
   * A partial guild member object. This is used to display the member in the UI.
   *
   * Roles are not included, as they are a) not needed and b) a security risk.
   */
  type PartialGuildMember = {
    id: string;
    username: string;
    /**
     * Either the global_name (global nick) or the username.
     */
    displayName: string;
    nick: string | null;
    avatar: string | null;
    /**
     * An optional guild avatar. Can be different from the user avatar.
     *
     * Only available if the user has Nitro.
     */
    guildAvatar: string | null;
  };
}

export {};
