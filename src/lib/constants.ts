// PUBLIC constants

import { env } from "$env/dynamic/public";
import type { APIGuildForumTag, GuildForumTagData } from "discord.js";
import type { IDBGuild, IDBUser } from "supportmail-types";

export const mediaQuery = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xl2: 1536,
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
      response_type: "code",
      redirect_uri: env.PUBLIC_discordRedirectUri,
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

export const BASIC_GET_FETCH_INIT = {
  method: "GET",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
} as RequestInit;

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
  userGuilds: (params: UserGuildsParams = {}) =>
    `${API_BASE}/@me/guilds?` +
    new URLSearchParams({
      bypass_cache: params.bypassCache ? "true" : "false",
      manage_bot_only: params.manageBotOnly ? "true" : "false",
    }).toString(),
  /**
   * Used for:
   * - GET: Get the DB user for a user
   * - PATCH: Update the DB user for a user
   * - DELETE: Delete the DB user for a user
   */
  user: () => `${API_BASE}/@me`,
  news: () => `${API_BASE}/news`,
  /**
   * Used for:
   * - GET: Get the config for a guild
   * - POST: Create a new config for a guild
   * - PATCH: Update the base config for a guild
   * - DELETE: Delete the config for a guild
   */
  configBase: (guildId: string) => `${API_BASE}/config/${guildId}`,
  /**
   * Used for:
   * - GET: Get the ticket config for a guild
   * - PATCH: Update the ticket config for a guild.
   */
  configTicketsBase: (guildId: string) => `${API_BASE}/config/${guildId}/ticket-config`,
  configTicketsSetup: (guildId: string) => `${API_BASE}/config/${guildId}/ticket-config/setup`,
  configReports: (guildId: string) => `${API_BASE}/config/${guildId}/report-config`,
  configTags: (guildId: string) => `${API_BASE}/config/${guildId}/tags`,
  configBlacklist: (guildId: string) => `${API_BASE}/config/${guildId}/blacklist`,
  logout: () => `${API_BASE}/logout`,
  /** @deprecated Not used atm */
  debug: (guildId: string) => `${API_BASE}/debug`,
} as const;

export const PLUGINS: AppPlugin[] = [
  {
    slug: "/tickets",
    name: "Tickets",
    description: "Modmail-like ticket system",
    iconUrl: "/icons/ticket.svg",
  },
  {
    slug: "/reports",
    name: "Reports",
    description: "Report users to the staff",
    iconUrl: "/icons/report.svg",
  },
];

export const LANGUAGES = [
  { name: "English", value: "en" },
  { name: "Deutsch", value: "de" },
  { name: "Français", value: "fr" },
];

export const DEFAULT_LANGUAGE = "en" as const;

/**
 * Default DB user object for type-safety
 */
export const DEFAULT_DBUSER: IDBUser = {
  id: "",
  autoRedirect: false,
  language: DEFAULT_LANGUAGE,
  t_left: 0,
  tips: true,
  createdAt: new Date(0),
  updatedAt: new Date(0),
} as const;

export const DEFAULT_CONFIG = {
  id: "",
  icon: "",
  lang: "en",
  name: "",
  createdAt: new Date(0),
  ticketConfig: {
    enabled: false,
    anonym: {
      enabled: false,
      user: false,
    },
    autoForwarding: true,
  },
  reportConfig: {
    enabled: false,
    actionsEnabled: true,
  },
} as IDBGuild;

/**
 * Generic emtpy error responses for API routes
 */
export const ErrorResponses = {
  badRequest: (text: string | null = null) => new Response(text, { status: 400, statusText: "Bad Request" }),
  unauthorized: () => new Response(null, { status: 401, statusText: "Unauthorized" }),
  forbidden: () => new Response(null, { status: 403, statusText: "Forbidden" }),
  notFound: (text: string | null = null) => new Response(text, { status: 404, statusText: "Not Found" }),
  tooManyRequests: () => new Response(null, { status: 429, statusText: "Too Many Requests" }),
};

export const LongTooltips = {
  pausedUntil_tickets:
    "Pausing tickets will prevent users from opening new tickets. Open tickets however will remain open allowing message exchange until reopened.",
  pausedUntil_reports:
    "Pausing reports will prevent users from creating new reports. Existing reports will still be processed and can be edited.",
} as const;

export const baseForumTagEmojis = {
  open: "🟢",
  closed: "🔴",
  unanswered: "❗",
  pendingQR: "🔐",
  uResponded: "💬",
  awaitingRes: "⏳",
} as const;

export function baseForumTags(lang: string): APIGuildForumTag[] {
  const tagInfo: string[][] = [
    ["open", baseForumTagEmojis.open],
    ["closed", baseForumTagEmojis.closed],
    ["unanswered", baseForumTagEmojis.unanswered],
    ["closeRequested", baseForumTagEmojis.pendingQR],
    ["userResponded", baseForumTagEmojis.uResponded],
    ["awaitingResponse", baseForumTagEmojis.awaitingRes],
  ];

  return tagInfo.map((tag) => ({
    emoji_name: tag[1],
    name: tag[0],
    id: "",
    moderated: false,
    emoji_id: "",
  }));
}
