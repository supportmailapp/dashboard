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
  setupTickets: () => `/ticket-setup` as const,
};
