// Public constants

import { env } from "$env/dynamic/public";

export const mediaQuery = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xl2: 1536,
} as const;

interface AuthorizeUrlParams {
  clientId: string;
  scope: string;
  state: string;
  redirectUri: string;
  promt?: string;
}

export const urls = {
  botAuth: function (clientId: string, guildId: string | null = null): string {
    const params = new URLSearchParams({
      client_id: clientId,
      permissions: env.PUBLIC_botPermissions,
      scope: "bot applications.commands",
    });
    if (guildId) params.append("guild_id", guildId);
    return "https://discord.com/oauth2/authorize?" + params.toString();
  },
  authorize: function ({ clientId, scope, state, redirectUri, promt = "none" }: AuthorizeUrlParams): string {
    return (
      "https://discord.com/oauth2/authorize?" +
      new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        prompt: promt,
        scope: scope,
        redirect_uri: redirectUri,
        state: state,
      }).toString()
    );
  },
  token: () => "https://discord.com/api/oauth2/token",
  revocation: () => "https://discord.com/api/oauth2/token/revoke",
} as const;

export const DISCORD_CDN_BASE = "https://cdn.discordapp.com" as const;

export const API_BASE = "/api/v1" as const;

interface UserGuildsParams {
  bypassCache?: boolean;
  manageBotOnly?: boolean;
}

/**
 * App API routes
 */
export const APIRoutes = {
  roles: (guildId: string) => `${API_BASE}/guilds/${guildId}/roles`,
  channels: (guildId: string) => `${API_BASE}/guilds/${guildId}/channels`,
  userGuilds: (userId: string, params: UserGuildsParams = {}) =>
    `${API_BASE}/users/${userId}/guilds?` +
    new URLSearchParams({
      bypass_cache: params.bypassCache ? "true" : "false",
      manage_bot_only: params.manageBotOnly ? "true" : "false",
    }).toString(),
} as const;
