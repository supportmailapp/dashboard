// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { ActiveGuild, BasicGuild } from "$lib/classes/guilds";
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
      guilds?: BasicGuild[] | null;
      guild?: ActiveGuild | null;
      user?: BaseUser | null;
    }

    interface PageData {
      guilds?: BasicGuild[];
      guild?: ActiveGuild;
      user?: BaseUser;
      status?: number;
      redirect?: string;
    }

    interface FullPageData extends PageData {
      guilds: BasicGuild[];
      guild: ActiveGuild;
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

  type BaseGuild = {
    id: string;
    name: string;
    iconHash: string | null;
    isConfigured: boolean;
  };

  type IActiveGuild = BaseGuild & {
    roles: BasicRole[];
    channels: BasicChannel[];
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
}

export {};
