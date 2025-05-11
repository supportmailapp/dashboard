import { env } from "$env/dynamic/public";

export interface AuthorizeUrlParams {
  clientId: string;
  scope: string;
  state: string;
  redirectUri: string;
  prompt?: string;
}

export interface UserGuildsParams {
  bypassCache?: boolean;
  manageBotOnly?: boolean;
}

export const API_BASE = "/api/v1" as const;

/**
 * App API routes
 */
export const APIRoutes = {
  roles: (guildId: string) => `${API_BASE}/guilds/${guildId}/roles` as const,
  channels: (guildId: string) => `${API_BASE}/guilds/${guildId}/channels` as const,
  userGuilds: (params: UserGuildsParams = {}) => {
    let sParams = new URLSearchParams();
    if (params.bypassCache === true) sParams.append("bypass_cache", "true");
    if (params.manageBotOnly === true) sParams.append("manage_bot", "true");
    return `${API_BASE}/@me/guilds` + (sParams.toString() ? `?${sParams.toString()}` : "");
  },
  guildMember: (guildId: string, memberId: string) => `${API_BASE}/guilds/${guildId}/members/${memberId}` as const,
  guildEmojis: (guildId: string) => `${API_BASE}/guilds/${guildId}/emojis` as const,
  emojis: (emojiKey: string) => `/emojis/${emojiKey}.svg` as const,
  /**
   * Used for:
   * - GET: Get the DB user for a user
   * - PATCH: Update the DB user for a user
   * - DELETE: Delete the DB user for a user
   */
  user: () => `${API_BASE}/@me` as const,
  news: () => `${API_BASE}/news` as const,
  /**
   * Used for:
   * - GET: Get the config for a guild
   * - POST: Create a new config for a guild
   * - PATCH: Update the base config for a guild
   * - DELETE: Delete the config for a guild
   */
  configBase: (guildId: string) => `${API_BASE}/config/${guildId}` as const,
  /**
   * Used for:
   * - GET: Get the ticket config for a guild
   * - PATCH: Update the ticket config for a guild.
   */
  configTicketsBase: (guildId: string) => `${API_BASE}/config/${guildId}/tickets` as const,
  /**
   * Used for:
   * - GET: Get all ticket categories for a guild (Max: 25)
   * - POST: Create a new ticket category for a guild
   * - PATCH: Update one ticket category for a guild
   * - DELETE: Delete a ticket category for a guild
   * - PUT: Update the order of ticket categories for a guild
   *   - Note: Payload has to be of the format `{ oldPosition: newPosition }`
   */
  configTicketCategories: (guildId: string) => `${API_BASE}/config/${guildId}/tickets/categories` as const,
  configTicketsSetup: (guildId: string) => `${API_BASE}/config/${guildId}/ticket-config/setup` as const,
  configReports: (guildId: string) => `${API_BASE}/config/${guildId}/report-config` as const,
  configTags: (guildId: string) => `${API_BASE}/config/${guildId}/tags` as const,
  configBlacklist: (guildId: string) => `${API_BASE}/config/${guildId}/blacklist` as const,
  logout: () => `${API_BASE}/logout` as const,
  /** @deprecated Not used atm */
  debug: () => `${API_BASE}/debug`,
} as const;

export const DISCORD_CDN_BASE = "https://cdn.discordapp.com" as const;

export const urls = {
  botAuth: function (clientId: string, guildId: string | null = null): string {
    const params = new URLSearchParams({
      client_id: clientId,
      permissions: env.PUBLIC_botPermissions!,
      scope: "bot applications.commands",
      response_type: "code",
      redirect_uri: env.PUBLIC_discordRedirectUri!,
    });
    if (guildId) params.append("guild_id", guildId);
    return "https://discord.com/oauth2/authorize?" + params.toString();
  },
  authorize: function ({ clientId, scope, state, redirectUri, prompt = "none" }: AuthorizeUrlParams): string {
    return (
      "https://discord.com/oauth2/authorize?" +
      new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        prompt: prompt,
        scope: scope,
        redirect_uri: redirectUri,
        state: state,
      }).toString()
    );
  },
  token: () => "https://discord.com/api/oauth2/token",
  revocation: () => "https://discord.com/api/oauth2/token/revoke",
} as const;

export const ImportantLinks = {
  legal: {
    notice: "https://legal.supportmail.dev",
    privacy: "https://legal.supportmail.dev/privacy",
    terms: "https://legal.supportmail.dev/terms",
    refundPolicy: "https://legal.supportmail.dev/refund-policy",
    imprint: "https://legal.supportmail.dev/imprint",
  },
} as const;
