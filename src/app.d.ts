import type { DiscordBotAPI, DiscordUserAPI } from "$lib/server/discord";
import type { DataManager } from "$lib/stores/DataManager.svelte";
import type { GuildsManager } from "$lib/stores/GuildsManager.svelte";
import type {
  APIChannel,
  APIDMChannel,
  APIGroupDMChannel,
  APIRole,
  APIThreadChannel,
  APIUser,
  RESTAPIPartialCurrentUserGuild,
} from "discord-api-types/v10";
import type { FlattenMaps } from "mongoose";
import type { IUserToken, PausedUntil } from "supportmail-types";
import type { SMErrorCodes } from "$lib/server/constants";
import type { Socket } from "socket.io-client";
import type { EventsMap } from "$lib/utils/websocket";

// for information about these interfaces
declare global {
  namespace App {
    interface Error {
      message: string;
      id?: string;
      status: number;
    }

    /**
     * @description Provides authentication state, user data, and Discord API access for request handling.
     * Contains session management utilities, user authentication status, and both bot and user-level
     * Discord REST API clients for interacting with Discord services.
     */
    interface Locals {
      getSafeSession: () => Promise<SafeSessionResult>;
      /**
       * @returns Whether the user is authenticated.
       */
      isAuthenticated: () => boolean;
      /**
       * Not used in the current implementation.
       * @returns Whether the user is an admin.
       */
      isAdmin?: () => Promise<boolean>;
      user: APIUser | null;
      token: FlatUserToken | null;
      /**
       * Given for every guild-param route.
       */
      guildId?: string;
      discordRest: DiscordBotAPI;
      /**
       * User API Client. Given always, if `locals.user` and `locals.token` is set.
       */
      discordUserRest: DiscordUserAPI | null;
    }

    interface PageData {
      wsToken?: string;
      ws?: Socket<EventsMap>;
      guildsManager: GuildsManager;
      manager: DataManager;
      user: APIUser | null;
      guildId?: string;
      /**
       * Checks if the current page matches the given href.
       * @param url The current URL.
       * @param check The href to check against the current page.
       * @param partial If true, checks if the current page starts with the given href. Defaults to true.
       * @returns True if the current page matches the href, false otherwise.
       */
      isCurrentPage: (href: string, partial?: boolean) => boolean;
      guildHref: (path: string) => string;
    }
  }

  type FlatUserToken = FlattenMaps<IUserToken>;

  /**
   * Represents the result of a safe session validation operation.
   *
   * This discriminated union type provides three possible outcomes:
   * - Success: Contains both user data and token when session is valid
   * - Expired: Contains token but no user when session has expired
   * - Error: Contains neither user nor token when session is not found or other errors occur
   *
   * @example
   * ```typescript
   * // Successful session
   * const success: SafeSessionResult = { user: apiUser, token: userToken };
   *
   * // Expired session
   * const expired: SafeSessionResult = { user: null, token: userToken, error: "expired" };
   *
   * // Session not found
   * const notFound: SafeSessionResult = { user: null, token: null, error: "notfound" };
   * ```
   */
  type SafeSessionResult =
    | { user: APIUser; token: FlatUserToken; error?: never }
    | { user: null; token: FlatUserToken; error: "expired" }
    | { user: null; token: null; error: "other" | "notfound" | "network" };

  /**
   * An API guild channel which is not a thread.
   */
  type GuildCoreChannel = Exclude<APIChannel, APIDMChannel | APIGroupDMChannel | APIThreadChannel>;

  type GuildCoreChannelType = GuildCoreChannel["type"];

  type GuildRole = APIRole;

  type GroupedChannels = {
    uncategorized: Exclude<GuildCoreChannel, APIGuildCategoryChannel>[];
    categories: {
      cat: APIGuildCategoryChannel;
      channels: Exclude<GuildCoreChannel, APIGuildCategoryChannel>[];
    }[];
  };

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

  type DCGuild = RESTAPIPartialCurrentUserGuild;

  type BotGuild = DCGuild & {
    isConfigured: boolean;
  };

  type APIPausedUntil = Omit<PausedUntil, "date"> & {
    /**
     * Whether something is paused.
     */
    value: boolean;
    /**
     * ISO 8601 string of the date, until something is paused.
     * If `null` -> indefinitly paused.
     */
    date: string | null;
  };

  type APIError = {
    message: string;
  };

  type MentionUser = Pick<APIUser, "id" | "username" | "global_name" | "avatar">;

  /**
   * A function type that handles saving operations with loading state management.
   *
   * @param setLoading - A callback function to update the loading state during the save operation
   * @param callback - An optional callback function that receives the saved data upon successful completion
   * @returns A Promise that resolves when the save operation is complete
   */
  type SaveFunction = (
    setLoading: (v: boolean) => void,
    callback?: (data: any) => void,
  ) => Promise<void> | void;

  type DocumentWithId<T> = T & {
    _id: string;
  };

  type StringifiedTicketStatus = "open" | "closed" | "closeRequested";

  type StringifiedReportStatus =
    | "open"
    | "ignored"
    | "timeouted"
    | "kicked"
    | "banned"
    | "messageDeleted"
    | "resolved";

  type PaginatedResponse<T> = {
    data: T[];
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
    error?: string;
  };

  type TPauseState = {
    pausedUntil: APIPausedUntil;
    type: "timed" | "indefinite";
    enabled: boolean;
  };

  namespace ClientAPI {
    interface TicketSetupUpdate {
      step: "checkingPermissions" | "creatingChannels" | "updatingDatabase" | "success";
      payload: {
        embeds: Array<{
          title: string;
          description: string;
          color: number;
          image?: {
            url: string;
          };
        }>;
        components?: any[];
      };
    }

    interface POSTTicketSetupJSONResultError {
      success: false;
      error: {
        code:
          | SMErrorCodes.CategoryCreationFailed
          | SMErrorCodes.ForumCreationFailed
          | SMErrorCodes.CommunityRequired
          | SMErrorCodes.MissingPermissions
          | SMErrorCodes.CategoryNotFound;
        message: string;
        permissionsMissing?: string[];
      };
    }

    interface POSTTicketSetupJSONResultSuccess {
      success: true;
      data?: {
        categoryId: string;
        forumId: string;
        forumName: string;
        tags: {
          open?: string;
          closed?: string;
          unanswered?: string;
          pendingQR?: string;
          uResponded?: string;
          awaitingRes?: string;
        } | null;
      };
    }

    type POSTTicketSetupJSONResult = {
      updates?: Array<{
        step: string;
        payload: any;
      }>;
    } & (POSTTicketSetupJSONResultSuccess | POSTTicketSetupJSONResultError);
  }
}

export {};
