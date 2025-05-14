// PUBLIC constants

import { Folder, MessageSquareDashed, MessageSquareWarning, ShieldBan, Star, Ticket } from "@lucide/svelte";
import type { APIGuildForumTag } from "discord-api-types/v10";

export const mediaQuery = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xl2: 1536,
} as const;

export const BASIC_GET_FETCH_INIT = {
  method: "GET",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
} as const;

export const BASIC_REQUEST_INIT = (method: "POST" | "PATCH" | "PUT" | "DELETE") =>
  ({
    ...BASIC_GET_FETCH_INIT,
    method: method,
  }) as RequestInit;

export const LANGUAGES = [
  { name: "English", value: "en" },
  { name: "Deutsch", value: "de" },
  { name: "Français", value: "fr" },
];

/**
 * Generic empty error responses for API routes
 */
export const ErrorResponses = {
  badRequest: (text: string | null = null) => new Response(text, { status: 400, statusText: "Bad Request" }),
  unauthorized: () => new Response(null, { status: 401, statusText: "Unauthorized" }),
  forbidden: () => new Response(null, { status: 403, statusText: "Forbidden" }),
  notFound: (text: string | null = null) => new Response(text, { status: 404, statusText: "Not Found" }),
  tooManyRequests: (tryAgainIn: number) =>
    new Response(null, {
      status: 429,
      statusText: "Too Many Requests",
      headers: { "Retry-After": tryAgainIn.toString() },
    }),
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

export const NavigationItems: (guildId: string) => NavItem[] = (guildId: string) => [
  {
    id: "tickets",
    name: "Tickets",
    href: `/g/${guildId}/tickets`,
    description: "Manage Ticket Configurations",
    icon: Ticket,
    color: "bg-primary text-primary-content",
    children: [
      {
        id: "ticket-categories",
        href: `/g/${guildId}/tickets/categories`,
        name: "Categories",
        icon: Folder,
        description: "Manage Ticket Categories",
      },
    ],
  },
  {
    id: "reports",
    name: "Reports",
    href: `/g/${guildId}/reports`,
    description: "Manage Report Configurations",
    icon: MessageSquareWarning,
    color: "bg-green-400 text-green-950",
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
    color: "bg-red-500 text-red-950",
  },
  {
    id: "premium",
    name: "Premium",
    href: `/g/${guildId}/premium`,
    description: "Manage Premium for this server",
    icon: Star,
    color: "bg-yellow-400 text-yellow-950",
  },
];
