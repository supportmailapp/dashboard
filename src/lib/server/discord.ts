// Server Discord API integration

import { discordBotToken } from "$env/static/private";
import {
  Routes,
  type APIGuildMember,
  type APIRole,
  type APIUser,
  type RESTAPIPartialCurrentUserGuild,
} from "discord-api-types/v10";
import { DiscordAPIError, REST, HTTPError, RateLimitError } from "discord.js";
import UserGuildsCache from "$lib/server/caches/userGuilds.js";

type SafeError = DiscordAPIError | HTTPError | RateLimitError | Error | string;
type DefinitelyHasError<E extends SafeError> = Omit<SafeResponse<null>, "error" | "data"> & {
  error: NonNullable<E>;
  data: null;
};

type DefinitelyHasData<T> = Omit<SafeResponse<T>, "error" | "data"> & {
  error: null;
  data: NonNullable<T>;
};

class SafeResponse<T = unknown> {
  public readonly data: T | null;
  public readonly error: SafeError | null;

  constructor(data: typeof this.data = null, error: typeof this.error = null) {
    this.data = data;
    this.error = error;
  }

  isSuccess(): this is DefinitelyHasData<T> {
    return this.data !== null && !this.error;
  }

  /**
   * Type guard to check if the response contains errors
   */
  public hasAnyError(): this is DefinitelyHasError<SafeError> {
    return this.error !== null;
  }

  public hasDiscordAPIError(): this is DefinitelyHasError<DiscordAPIError> {
    return this.error instanceof DiscordAPIError;
  }

  public hasHTTPError(): this is DefinitelyHasError<HTTPError> {
    return this.error instanceof HTTPError;
  }

  public hasRateLimitError(): this is DefinitelyHasError<RateLimitError> {
    return this.error instanceof RateLimitError;
  }
}

/**
 * Abstract base class for Discord API clients.
 * Provides common and safe functionality for making Discord API requests.
 */
abstract class BaseDiscordAPI {
  protected readonly rest: REST;

  constructor(token: string) {
    this.rest = new REST({ version: "10" }).setToken(token);
  }

  public get instance(): REST {
    return this.rest;
  }

  protected async doSafeRequest<T>(request: () => Promise<any>): Promise<SafeResponse<T>> {
    try {
      const data = await request();
      return new SafeResponse(data);
    } catch (error) {
      return new SafeResponse<T>(null, error as DiscordAPIError | HTTPError | RateLimitError | Error);
    }
  }
}

/**
 * Represents a Discord bot API client.
 * This class provides methods to interact with the Discord API using the bot token.
 */
class DiscordBotAPI extends BaseDiscordAPI {
  constructor() {
    super(discordBotToken);
  }

  public async getGuildChannels(guildId: string): Promise<SafeResponse<GuildCoreChannel[]>> {
    return this.doSafeRequest(() => this.rest.get(Routes.guildChannels(guildId)) as any);
  }

  public async getGuildRoles(guildId: string): Promise<SafeResponse<APIRole[]>> {
    return this.doSafeRequest(() => this.rest.get(Routes.guildRoles(guildId)) as any);
  }

  public async getGuildMember(guildId: string, memberId: string): Promise<SafeResponse<APIGuildMember>> {
    return this.doSafeRequest(() => this.rest.get(Routes.guildMember(guildId, memberId)) as any);
  }
}

export { DiscordBotAPI };

/**
 * Represents a Discord user API client.
 * This class provides methods to interact with the Discord API using a user access token.
 */
class DiscordUserAPI extends BaseDiscordAPI {
  private _userId: string | null = null;
  /**
   * @param at The Discord User Access Token (AT) to authenticate API requests.
   */
  constructor(at: string, userId?: string) {
    super(at);
    this._userId = userId ?? null;
  }

  /**
   * Gets the user ID.
   * @returns The user ID, if available.
   *
   * This will always be set if the `this.getCurrentUser` was called successfully because the function sets the user ID then.
   */
  get userId() {
    return this._userId;
  }

  /**
   * Retrieves the current authenticated user from the Discord API.
   *
   * @returns A promise that resolves to a SafeResponse containing the current user's data.
   *          On success, the user ID is cached internally for future use.
   *
   * @see {@link https://discord.com/developers/docs/resources/user#get-current-user}
   */
  public async getCurrentUser(): Promise<SafeResponse<APIUser>> {
    const _res = await this.doSafeRequest<APIUser>(() => this.rest.get(Routes.user()));
    if (_res.isSuccess()) {
      this._userId = _res.data.id;
    }
    return _res;
  }

  /**
   * Retrieves the current user's Discord guilds.
   *
   * @param userId - The ID of the user whose guilds to retrieve
   * @param skipCache - Whether to skip cache lookup and force a fresh API request. Defaults to `false`.
   * @returns A Promise that resolves to a SafeResponse containing an array of partial current user guild objects
   *
   * @remarks
   * This method implements caching for user guilds. When skipCache is false and the user's guilds
   * are already cached, it returns the cached data. Otherwise, it makes a fresh API request to
   * Discord's REST API and caches the result for future use.
   *
   * @see {@link https://discord.com/developers/docs/resources/user#get-current-user-guilds}
   */
  public async getCurrentUserGuilds(
    userId: string,
    skipCache = false,
  ): Promise<SafeResponse<RESTAPIPartialCurrentUserGuild[]>> {
    if (skipCache && UserGuildsCache.hasUser(userId)) {
      return new SafeResponse(UserGuildsCache.getUserGuilds(userId));
    }

    const _res = await this.doSafeRequest<RESTAPIPartialCurrentUserGuild[]>(() =>
      this.rest.get(Routes.userGuilds()),
    );
    if (_res.isSuccess()) {
      const _guilds = _res.data;
      UserGuildsCache.cacheUserGuilds(userId, _guilds);
    }

    return _res as any;
  }

  /**
   * Retrieves the current bot's guild member information for a specific guild.
   *
   * @param guildId - The ID of the guild to get the member information from
   * @returns A promise that resolves to a SafeResponse containing the API guild member object
   *
   * @see {@link https://discord.com/developers/docs/resources/user#get-current-user-guild-member}
   */
  public async getCurrentUserGuildMember(guildId: string): Promise<SafeResponse<APIGuildMember>> {
    return this.doSafeRequest(() => this.rest.get(Routes.guildMember(guildId, "@me")) as any);
  }
}

export { DiscordUserAPI };
