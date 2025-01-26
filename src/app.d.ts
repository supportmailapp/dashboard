// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { GuildChannelType } from "discord-api-types/v10";

declare global {
  namespace App {
    interface Error {
      errorId?: string;
      message?: string;
      status?: number;
      details?: any;
    }

    interface Locals {
      guilds?: PartialGuild[] | null;
      currentGuild?: CurrentGuild | null;
      currentUser?: CurrentUser | null;
    }

    interface PageData {
      guilds?: PartialGuild[];
      currentGuild?: CurrentGuild;
      currentUser?: CurrentUser;
      status?: number;
      redirect?: string;
    }

    // interface PageState {}

    // interface Platform {}
  }

  type PartialRole = {
    id: string;
    name: string;
    color: number;
    position: number;
    // permissions: string; // ? Is this needed?
  };

  type PartialChannel = {
    id: string;
    name: string;
    type: GuildChannelType;
    position: number;
  };

  type PartialGuild = {
    id: string;
    name: string;
    iconHash: string | null;
    isConfigured: boolean;
  };

  type CurrentGuild = PartialGuild & {
    roles: PartialRole[];
    channels: PartialChannel[];
  };

  type CurrentUser = {
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
}

export {};
