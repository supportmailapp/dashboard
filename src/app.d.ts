import type { DiscordBotAPI, DiscordUserAPI } from "$lib/server/discord";
import type { DataManager } from "$lib/stores/DataManager.svelte";
import type { GuildsManager } from "$lib/stores/GuildsManager.svelte";
import type {
  APIChannel,
  APIDMChannel,
  APIGroupDMChannel,
  APIThreadChannel,
  APIUser,
  RESTAPIPartialCurrentUserGuild,
} from "discord-api-types/v10";
import type { FlattenMaps } from "mongoose";
import type { IUserToken } from "supportmail-types";
import type { PUTPausingObject } from "./routes/api/v1/guilds/[guildid]/config/pausing/[modul]/+server";

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
      /**
       * Given for every guild-param route.
       */
      guildId?: string;
      discordRest: DiscordBotAPI;
      discordUserRest: DiscordUserAPI | null;
    }

    interface PageData {
      guildsManager: GuildsManager;
      manager: DataManager;
      user: APIUser | null;
      guildId?: string;
      isCurrentPage: (href: string, partial?: boolean) => boolean;
      guildHref: (path: string) => string;
    }
  }

  type FlatUserToken = FlattenMaps<IUserToken>;

  /**
   * An API guild channel which is not a thread.
   */
  type GuildCoreChannel = Exclude<APIChannel, APIDMChannel | APIGroupDMChannel | APIThreadChannel>;

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

  type APIPausedUntil = PUTPausingObject & {
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
}

export {};
