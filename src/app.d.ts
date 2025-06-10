import type { DiscordBotAPI, DiscordUserAPI } from "$lib/server/discord";
import type {
  APIChannel,
  APIDMChannel,
  APIGroupDMChannel,
  APIThreadChannel,
  APIUser,
} from "discord-api-types/v10";
import type { FlattenMaps } from "mongoose";
import type { IUserToken } from "supportmail-types";

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
  | { user: null; token: null; error: "other" | "notfound" };

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
      discordRest: DiscordBotAPI;
      discordUserRest: DiscordUserAPI | null;
    }

    interface PageData {
      user: APIUser | null;
    }
  }

  type FlatUserToken = FlattenMaps<IUserToken>;

  /**
   * An API guild channel which is not a thread.
   */
  type GuildCoreChannel = Exclude<APIChannel, APIDMChannel | APIGroupDMChannel | APIThreadChannel>;
}

export {};
