// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { Guild } from "$lib/classes/guilds";
import type { APIGuildChannel, ChannelType, GuildChannelType } from "discord-api-types/v10";

declare global {
  namespace App {
    interface Error {
      errorId?: string;
      message?: string;
      status?: number;
      details?: any;
    }

    interface Locals {
      guilds?: Guild[] | null;
      guild?: Guild | null;
      user?: BaseUser | null;
    }

    interface PageData {
      guilds?: Guild[];
      guild?: Guild;
      user?: BaseUser;
      status?: number;
      redirect?: string;
    }

    interface FullPageData extends PageData {
      guilds: Guild[];
      guild: Guild & { isConfigured: true };
      user: BaseUser;
      status?: number;
      redirect?: string;
    }

    // interface PageState {}

    // interface Platform {}
  }

  type BasicRole = {
    id: string;
    name: string;
    color: number;
    position: number;
    permissions: string; // ? Is this needed?
  };

  type BasicChannel = {
    id: string;
    name: string;
    type: ChannelType;
    position: number;
  };

  /**
   * Represents a guild (server) in the application.
   */
  type IGuild = {
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
    permissions: number | bigint;
    /**
     * An optional array of basic roles in the guild.
     */
    roles?: BasicRole[];
    /**
     * An optional array of basic channels in the guild.
     */
    channels?: BasicChannel[];
  };

  type BaseUser = {
    id: string;
    username: string;
    displayName: string;
    avatarHash: string | null;
  };

  type FormValidationRateimitError = {
    error: "Rate limited";
    /**
     * The number of milliseconds before the rate limit resets.
     */
    retryAfter: number;
  };

  /**
   * An API guild channel which is not a thread.
   */
  type APIGuildCoreChannel = APIGuildChannel<
    Exclude<GuildChannelType, ChannelType.PublicThread | ChannelType.PrivateThread | ChannelType.AnnouncementThread>
  >;

  type CookieToken = {
    sessionId: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: string; // ISO 8601
    userId?: string;
  };

  type FullCookieToken = Required<CookieToken>;

  type JWTCookiePayload = JwtPayload & CookieToken;
}

export {};
