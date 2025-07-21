// Private constants

import { env } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";

export const authData = {
  algorithm: "HS256",
  expiresIn: "7d",
} as const;

export const discord = {
  clientId: env.CLIENT_ID,
  clientSecret: env.CLIENT_SECRET,
  redirectUri: (origin: string) => origin + "/login/callback",
  supportServerId: publicEnv.PUBLIC_SupportServer,
  baseScopes: ["identify", "guilds", "guilds.members.read"],
} as const;

export function ErrorJsonResponse(status: number, statusText: string, message: string) {
  return Response.json(
    {
      message: message,
    },
    {
      status: status,
      statusText: statusText,
    },
  );
}

export const ClientApiRoutes = {
  ticketSetup: () => `/ticket-setup` as const,
};

export enum SMErrorCodes {
  UnknownError = 0,
  GuildNotFound = 101,
  UserNotFound = 102,
  TimestringError = 103,

  Tickets = 1000,
  ForumNotFound = 1001,
  CategoryCreationFailed = 1002,
  ForumCreationFailed = 1003,
  TicketNotFound = 1004,
  TicketCreationFailed = 1005,
  TicketClosed = 1006,
  TicketsPaused = 1007,
  TicketsDisabled = 1008,
  TicketPostNotFound = 1009,
  PanelNotSentOrEdited = 1010,
  TicketSetupFailed = 1011,
  TicketsAnonymNotEnabled = 1012,
  CommunityRequired = 1013,
  MissingPermissions = 1014,
  CategoryNotFound = 1015,

  Reports = 2000,
  SendingReportFailed = 2001,
  ReportsPaused = 2002,
  ReportsNotEnabledOrConfigured = 2003,
  ReportRateLimitExceeded = 2004,

  AccesstokenNotFound = 3000,
  AccesstokenInvalid = 3001,
  NotLoggedIn = 3002,
  CommandConfigNotFound = 3003,
  WebhookCreationFailed = 3004,
  /**
   * Discord has a limit of 10 (?) webhooks per channel and 100 webhooks per guild.
   */
  MaxNumberOfWebhooksReached = 3005,
  WebhookNotFound = 3006,

  ClientNotFound = 5000,
  ClientNotCreatedYet = 5001,
  MemberNotFound = 5002,
  DatabaseError = 3003,
}
