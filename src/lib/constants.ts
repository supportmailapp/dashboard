// PUBLIC constants

import { env } from "$env/dynamic/public";
import { MessageSquareDashed, MessageSquareWarning, ShieldBan, Star, Ticket } from "@lucide/svelte";
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
      permissions: env.PUBLIC_botPermissions!,
      scope: "bot applications.commands",
      response_type: "code",
      redirect_uri: env.PUBLIC_discordRedirectUri!,
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
} as const;

export const BASIC_REQUEST_INIT = (method: "POST" | "PATCH" | "DELETE") =>
  ({
    method: method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  }) as RequestInit;

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
  userGuilds: (params: UserGuildsParams = {}) => {
    let sParams = new URLSearchParams();
    if (params.bypassCache === true) sParams.append("bypass_cache", "true");
    if (params.manageBotOnly === true) sParams.append("manage_bot", "true");
    return `${API_BASE}/@me/guilds` + (sParams.toString() ? `?${sParams.toString()}` : "");
  },
  guildMember: (guildId: string, memberId: string) => `${API_BASE}/guilds/${guildId}/members/${memberId}`,
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
  debug: () => `${API_BASE}/debug`,
} as const;

export const LANGUAGES = [
  { name: "English", value: "en" },
  { name: "Deutsch", value: "de" },
  { name: "Français", value: "fr" },
];

/**
 * Generic emtpy error responses for API routes
 */
export const ErrorResponses = {
  badRequest: (text: string | null = null) => new Response(text, { status: 400, statusText: "Bad Request" }),
  unauthorized: () => new Response(null, { status: 401, statusText: "Unauthorized" }),
  forbidden: () => new Response(null, { status: 403, statusText: "Forbidden" }),
  notFound: (text: string | null = null) => new Response(text, { status: 404, statusText: "Not Found" }),
  tooManyRequests: (tryAgainIn: number) =>
    new Response(null, { status: 429, statusText: "Too Many Requests", headers: { "Retry-After": tryAgainIn.toString() } }),
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

export function baseForumTags(): APIGuildForumTag[] {
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

export const SupportedLanguages = [
  { name: "English", value: "en" },
  { name: "Deutsch", value: "de" },
  { name: "Français", value: "fr" },
];

export const NavigationItems = (guildId: string) => [
  {
    id: "tickets",
    name: "Tickets",
    href: `/g/${guildId}/tickets`,
    description: "Manage Ticket Configurations",
    icon: Ticket,
    color: "bg-primary text-primary-content",
  },
  {
    id: "reports",
    name: "Reports",
    href: `/g/${guildId}/reports`,
    description: "Manage Report Configurations",
    icon: MessageSquareWarning,
    color: "bg-amber-600 text-amber-600-content",
  },
  {
    id: "tags",
    name: "Tags",
    href: `/g/${guildId}/tags`,
    description: "Manage Tags",
    icon: MessageSquareDashed,
    color: "bg-info text-info-content",
  },
  {
    id: "blacklist",
    name: "Blacklist",
    href: `/g/${guildId}/blacklist`,
    description: "Manage the Blacklist",
    icon: ShieldBan,
    color: "bg-red-700 text-error-content",
  },
  {
    id: "premium",
    name: "Premium",
    href: `/g/${guildId}/premium`,
    description: "Manage Premium for this server",
    icon: Star,
    color: "bg-warning text-warning-content",
  },
];
