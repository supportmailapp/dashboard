import type { DiscordBotAPI, DiscordUserAPI } from "$lib/server/discord";
import type {
  APIChannel,
  APIDMChannel,
  APIGroupDMChannel,
  APIThreadChannel,
  APIUser,
} from "discord-api-types/v10";
import type { FlattenMaps } from "mongoose";
import type { IDBUser, ISession } from "supportmail-types";

// for information about these interfaces
declare global {
  namespace App {
    interface Error {
      message: string;
      id?: string;
      status?: number;
    }

    interface Locals {
      getSafeSession: () => Promise<{ session: FlattenedSession | null; user: User | null }>;
      isAuthenticated: () => boolean;
      /**
       * Not used in the current implementation.
       * @returns Whether the user is an admin.
       */
      isAdmin?: () => Promise<boolean>;
      user: APIUser | null;
      session: FlattenedSession | null;
      discordRest: DiscordBotAPI;
      discordUserRest: DiscordUserAPI | null;
    }

    interface PageData {
      user: APIUser | null;
      session: FlattenedSession | null;
    }
  }

  type FlattenedSession = FlattenMaps<ISession>;

  /**
   * An API guild channel which is not a thread.
   */
  type GuildCoreChannel = Exclude<APIChannel, APIDMChannel | APIGroupDMChannel | APIThreadChannel>;
}

export {};
