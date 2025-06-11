// Public constants
import { RouteBases, Routes } from "discord-api-types/v10";
import { env as pubEnv } from "$env/dynamic/public";

export const JsonErrors = {
  /**
   * 400 Bad Request
   */
  badRequest: (message: string = "") => Response.json({ error: message || "Bad Request" }, { status: 400 }),
  /**
   * 401 Unauthorized
   */
  unauthorized: (message: string = "") =>
    Response.json({ error: message || "Unauthorized" }, { status: 401 }),
  /**
   * 403 Forbidden
   */
  forbidden: (message: string = "") => Response.json({ error: message || "Forbidden" }, { status: 403 }),
  /**
   * 404 Not Found
   */
  notFound: (message: string = "") => Response.json({ error: message || "Not Found" }, { status: 404 }),
  /**
   * 409 Conflict
   */
  conflict: (message: string = "") => Response.json({ error: message || "Conflict" }, { status: 409 }),
  /**
   * 429 Too Many Requests
   */
  tooManyRequests: (message: string = "") =>
    Response.json({ error: message || "Too Many Requests" }, { status: 429 }),
  /**
   * 500 Internal Server Error
   */
  serverError: (message: string = "") =>
    Response.json({ error: message || "Internal Server Error" }, { status: 500 }),
} as const;

export const LANGUAGES = [
  {
    value: "en",
    name: "English",
  },
  {
    value: "de",
    name: "Deutsch",
  },
  {
    value: "fr",
    name: "Français",
  },
] as const;

export const urls = {
  discord: {
    base: "https://discord.com",
    apiBase: RouteBases.api,
    /**
     * Used for
     * - token exchange
     * - token refresh
     */
    tokenExchange: () => `${RouteBases.api}${Routes.oauth2TokenExchange()}` as const,
    tokenRevocation: () => `${RouteBases.api}${Routes.oauth2TokenRevocation()}` as const,
    botAuth: function (state: string, guildId?: string) {
      const url = new URL(Routes.oauth2Authorization(), this.base);
      const searchP = new URLSearchParams({
        client_id: pubEnv.PUBLIC_ClientId,
        scope: "bot applications.commands identify guilds guilds.members.read",
        response_type: "code",
        redirect_uri: pubEnv.PUBLIC_discordRedirectUri,
        state: state,
      });
      if (guildId) searchP.set("guild_id", guildId);
      return url.toString() + `?${searchP.toString()}`;
    },
  },
};
