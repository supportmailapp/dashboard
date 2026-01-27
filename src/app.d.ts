import type { SMErrorCodes } from "$lib/server/constants";
import type { DiscordBotAPI, DiscordUserAPI } from "$lib/server/discord";
import type { IUserToken, PausedUntil } from "$lib/sm-types";
import type { GuildsManager } from "$lib/stores/GuildsManager.svelte";
import type { EventsMap } from "$lib/utils/websocket";
import type {
  APIChannel,
  APIDMChannel,
  APIGroupDMChannel,
  APIRole,
  APIThreadChannel,
  APIUser,
  GuildChannelType,
  GuildTextChannelType,
  RESTAPIPartialCurrentUserGuild,
} from "discord-api-types/v10";
import type { FlattenMaps } from "mongoose";
import type { Socket } from "socket.io-client";

// for information about these interfaces
declare global {
  namespace App {
    interface Error {
      message: string;
      id?: string;
      status?: number;
    }

    /**
     * @description Provides authentication state, user data, and Discord API access for request handling.
     * Contains session management utilities, user authentication status, and both bot and user-level
     * Discord REST API clients for interacting with Discord services.
     */
    interface Locals {
      /**
       * @returns Whether the user is authenticated.
       */
      isAuthenticated: () => boolean;
      /**
       * Not used in the current implementation.
       * @returns Whether the user is an admin.
       */
      isAdmin?: () => boolean;
      user: APIUser | null;
      token: FlatUserToken | null;
      discordRest: DiscordBotAPI;
      /**
       * User API Client. Given always, if `locals.user` and `locals.token` is set.
       */
      discordUserRest: DiscordUserAPI | null;
    }

    interface PageData {
      wsToken?: string;
      ws?: Socket<EventsMap>;
      user: APIUser | null;
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
   * A guild channel from the Discord API. Can be anything.
   */
  type APIGuildChannel = Extract<APIChannel, { type: GuildChannelType }>;
  /**
   * An API guild channel which is not a thread. Not all channels are sendable (forum, category, media).
   */
  type GuildCoreChannel = Exclude<APIGuildChannel, APIThreadChannel>;
  type GuildCoreChannelType = GuildCoreChannel["type"];
  /**
   * A guild channel that can be sent messages to.
   */
  type GuildSendableChannel = Extract<APIGuildChannel, { type: GuildTextChannelType }>;

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
      data: {
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

    type POSTTicketSetupJSONResult = POSTTicketSetupJSONResultSuccess | POSTTicketSetupJSONResultError;

    interface CategoriesTagsUpdate {
      guildId: string;
      categories: Array<{
        _id: string;
        label: string;
        tag?: string;
        emoji?: string;
        removeTag?: boolean;
      }>;
    }

    interface CategoriesTagsResult {
      success: boolean;
      /**
       * Array of updated categories with their tag IDs.
       *
       * Only given if any were updated!
       */
      data?: Array<{
        categoryId: string;
        tagId: string;
      }>;
      error?: string;
    }
  }

  namespace Unsplash {
    /**
     * The simplified image object returned by our API and used in the frontend.
     */
    type MyImage = {
      /**
       * The ID of the image.
       */
      id: string;
      /**
       * The URL of the image.
       */
      url: string;
      /**
       * The url to the image page on Unsplash.
       */
      htmlUrl: string;
      /**
       * The author of the image.
       */
      authorName: string;
      /**
       * The author's Unsplash profile URL.
       */
      authorProfileUrl: string;
      /**
       * The blur hash of the image.
       */
      blurHash: string;
    };

    type StoredImage = {
      /** ISO 8601 string representing the timestamp when the image was stored. (expires after 5 minutes) */
      timestamp: string;
      image: MyImage;
    };

    /**
     * Represents an image object returned by the Unsplash API.
     */
    type Image = {
      id: string;
      created_at: string;
      updated_at: string;
      width: number;
      height: number;
      color: string;
      blur_hash: string;
      downloads: number;
      description: string | null;
      exif: Unsplash.ExifData | null;
      location: {
        name: string | null;
        city: string | null;
        country: string | null;
        position: {
          latitude: number;
          longitude: number;
        } | null;
      } | null;
      current_user_collections: Array<Unsplash.UserCollection>;
      urls: {
        raw: string;
        full: string;
        regular: string;
        small: string;
        thumb: string;
      };
      links: {
        self: string;
        html: string;
        download: string;
        download_location: string;
      };
      user: Unsplash.User;
    };

    type User = {
      id: string;
      updated_at: string;
      username: string;
      name: string;
      portfolio_url: string | null;
      bio: string;
      location: string;
      total_collections: number;
      instagram_username: string | null;
      twitter_username: string | null;
      links: {
        self: string;
        html: string;
        photos: string;
        portfolio: string;
      };
    };

    type UserCollection = {
      id: number;
      title: string;
      published_at: string;
      last_collected_at: string;
      updated_at: string;
      cover_photo: unknown;
      user: unknown; // can be null? wtf Unsplash docs
    };

    type ExifData = {
      make: string | null;
      model: string | null;
      exposure_time: string | null;
      aperture: string | null;
      focal_length: string | null;
      iso: number | null;
    };

    type GetImageRes =
      | {
          type: "error";
          message: string;
        }
      | {
          type: "success";
          image: Unsplash.MyImage;
        };
  }
}

export {};
