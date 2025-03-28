// Private utility stuff for Discord-related operations

import { env } from "$env/dynamic/private";
import { cacheGuilds, getUserGuilds, parseToCacheGuild } from "$lib/cache/guilds";
import { getMember } from "$lib/cache/members";
import { getDiscordUser } from "$lib/cache/users";
import { DBGuild } from "$lib/server/db";
import { canManageBot } from "$lib/utils/permissions";
import { REST } from "@discordjs/rest";
import {
  RouteBases,
  Routes,
  type APIGuildMember,
  type APIRole,
  type APIUser,
  type RESTAPIPartialCurrentUserGuild,
  type RESTPostOAuth2AccessTokenResult,
} from "discord-api-types/v10";
import jwt from "jsonwebtoken";

export class DiscordREST {
  private readonly rest: REST;
  constructor() {
    this.rest = new REST({ version: "10" }).setToken(env.discordBotToken);
  }

  public get instance(): REST {
    return this.rest;
  }

  public async getGuildChannels(guildId: string): Promise<GuildCoreChannel[]> {
    return this.rest.get(Routes.guildChannels(guildId)) as any;
  }

  public async getGuildRoles(guildId: string): Promise<APIRole[]> {
    return this.rest.get(Routes.guildRoles(guildId)) as any;
  }
}

/**
 * Fetches user data from the Discord API using the provided access token.
 *
 * It first attempts to retrieve the user data from the cache.
 * If the data is not found in the cache, it fetches the data from the API and caches it for future use.
 *
 * @returns A promise that resolves to the user data.
 * @throws {Response} Will throw an error if the API request fails. Format: `{ status: number, message: string }`
 */
export async function fetchUserData(userId: string, token: string, useCache = true): Promise<APIUser> {
  const userData = getDiscordUser(userId);
  if (useCache && userData) return userData;

  const userRes = await fetch(RouteBases.api + Routes.user(), {
    method: "GET",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
  });

  if (!userRes.ok) {
    throw userRes;
  }

  const userResJson = await userRes.json();
  return userResJson;
}

interface FetchUserGuildsOptions {
  /**
   * Whether to bypass the cache and fetch fresh data from the API. Defaults to `false`.
   */
  bypassCache?: boolean;
  /**
   * Options for filtering the guilds to be returned.
   */
  only?: {
    /**
     * Whether to only return guilds that the bot is configured in. This doesn't mean the user can manage the guild.
     *
     * - Note: Mutually exclusive with `canManage`.
     */
    isConfigured?: boolean;
    /**
     * Whether to only return guilds that the user can manage. This automatically implies that the bot is configured in the guild.
     *
     * - Note: Mutually exclusive with `isConfigured`.
     */
    canManage?: boolean;
  };
}

/**
 * Fetches the guilds that the current user guilds from the Cache or Discord API.
 *
 * **Note: Don't update the cache afterwards! This will be handled by the function itself.**
 *
 * @param userId - The ID of the user whose guilds are to be fetched.
 * @param accessToken - The access token for authenticating the request.
 * @param fetch - The fetch function to make the HTTP request.
 * @param options - Options for fetching user guilds.
 * @returns A promise that resolves to an array of partial guild objects.
 * @throws {Response} An error object containing the status and message if the request fails.
 */
export async function fetchUserGuilds(
  userId: string,
  accessToken: string,
  options: FetchUserGuildsOptions = {},
): Promise<DCGuild[]> {
  options = { bypassCache: false, only: {}, ...options };
  if (!options.bypassCache) {
    const cachedGuilds = getUserGuilds(userId);
    if (cachedGuilds) {
      return cachedGuilds;
    }
  }

  const guildRes = await fetch(RouteBases.api + Routes.userGuilds(), {
    method: "GET",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!guildRes.ok) {
    throw { status: guildRes.status, message: guildRes.statusText };
  }

  const guildResJson = (await guildRes.json()) as RESTAPIPartialCurrentUserGuild[];
  // Filter those guilds that the bot is a part of
  const validGuilds = await DBGuild.find({ id: { $in: guildResJson.map((g) => g.id) } }, { id: 1 }, { lean: true });
  const guilds = guildResJson.map((guild) =>
    parseToCacheGuild(
      guild,
      validGuilds.some((vg) => vg.id === guild.id),
    ),
  );

  cacheGuilds(...guilds);

  if (options.only?.isConfigured) {
    return guilds.filter((g) => g.isConfigured);
  }
  if (options.only?.canManage) {
    return guilds.filter((g) => canManageBot(BigInt(g.permissions)));
  }

  return guilds;
}

/**
 * Fetches a guild member's data from the Discord API.
 *
 * This function first attempts to retrieve the guild member's data from a cache.
 * If the data is not found in the cache, it makes an API request to fetch the data.
 *
 * @param guildId - The ID of the guild.
 * @param userId - The ID of the user.
 * @param accessToken - The access token for authorization.
 * @returns A promise that resolves to the guild member's data.
 * @throws {Response} Will throw an error if the fetch operation fails.
 */
export async function fetchGuildMember(guildId: string, userId: string, accessToken: string): Promise<APIGuildMember> {
  const cachedMember = getMember(guildId, userId);
  if (cachedMember) return cachedMember;

  const memberRes = await fetch(RouteBases.api + Routes.guildMember(guildId, userId), {
    method: "GET",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!memberRes.ok) {
    if (memberRes.status != 429) console.error("Failed to fetch guild member data:", memberRes);
    throw memberRes;
  }

  const memberResJson = await memberRes.json();
  return memberResJson;
}
