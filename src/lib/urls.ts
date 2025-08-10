import { env as pubEnv } from "$env/dynamic/public";
import { RouteBases, Routes } from "discord-api-types/v10";

const DISCORD_CDN_BASE = RouteBases.cdn;
const API_BASE = "/api/v1" as const;

const discordUrls = {
  base: "https://discord.com",
  apiBase: RouteBases.api,
  /**
   * Used for
   * - token exchange
   * - token refresh
   */
  token: () => `${RouteBases.api}${Routes.oauth2TokenExchange()}` as const,
  tokenRevocation: () => `${RouteBases.api}${Routes.oauth2TokenRevocation()}` as const,
  botAuth: function (
    origin: string,
    { guildId, state, addBot }: { guildId?: string; state?: string; addBot?: boolean } = {},
  ) {
    const url = new URL(Routes.oauth2Authorization(), this.base);
    const searchP = new URLSearchParams({
      client_id: pubEnv.PUBLIC_ClientId,
    });

    if (addBot) {
      searchP.set("scope", "bot applications.commands");
      searchP.set("permissions", pubEnv.PUBLIC_botPermissions);
      searchP.set("integration_type", "0");
    } else {
      searchP.set("scope", "identify guilds guilds.members.read");
      searchP.set("response_type", "code");
      searchP.set("redirect_uri", origin + "/login/callback");
      searchP.set("prompt", "true");
    }
    if (state) searchP.set("state", state);
    if (guildId) searchP.set("guild_id", guildId);
    return url.toString() + `?${searchP.toString()}`;
  },
};

const cdnUrls = {
  guildIcon: (guildId: string, icon: string | null, size: number | string = "512") =>
    DISCORD_CDN_BASE + (icon ? `/icons/${guildId}/${icon}.webp?size=${size}` : `/embed/avatars/1.png`),
  userAvatar: (userId: string, avatar: string | null, size: number | string = "512") =>
    DISCORD_CDN_BASE +
    (avatar
      ? `/avatars/${userId}/${avatar}.webp?size=${size}`
      : `/embed/avatars/${(Number(userId) >> 22) % 6}.png`),
  guildEmoji: (emojiId: string, size = 64) =>
    `${DISCORD_CDN_BASE}/emojis/${emojiId}.webp?size=${size}` as const,
};

const addFilterParam = (filter?: "bot") => {
  switch (filter) {
    case "bot":
      return "&filter=bot";
  }
  return "";
};

const APIRoutes = {
  me: () => `${API_BASE}/@me` as const,
  /**
   * Returns the URL for the current user's guilds.
   * @param manageBotOnly If true, only returns guilds where the bot has manage permissions.
   *
   * @default `${API_BASE}/@me/guilds`
   */
  userGuilds: (manageBotOnly = false) => {
    const sParams = new URLSearchParams();
    if (manageBotOnly) sParams.set("manageBot", "true");
    return `${API_BASE}/@me/guilds` + (sParams.toString() ? `?${sParams.toString()}` : "");
  },
  guildChannels: (guildId: string) => `${API_BASE}/guilds/${guildId}/channels` as const,
  guildChannel: (guildId: string, channelId: string) =>
    `${API_BASE}/guilds/${guildId}/channels/${channelId}` as const,
  guildRoles: (guildId: string) => `${API_BASE}/guilds/${guildId}/roles` as const,
  /**
   * Returns the URL for a specific guild's configuration.
   * @param guildId The ID of the guild.
   */
  guildConfig: (guildId: string) => `${API_BASE}/guilds/${guildId}/config` as const,
  tickets: (guildId: string) => `${API_BASE}/guilds/${guildId}/tickets` as const,
  /**
   * Returns the URL for a specific guild's tickets configuration.
   */
  ticketsConfig: (guildId: string) => `${API_BASE}/guilds/${guildId}/config/tickets` as const,
  ticketSetup: (guildId: string) => `${API_BASE}/guilds/${guildId}/config/tickets/setup` as const,
  ticketFeedbackSetup: (guildId: string) =>
    `${API_BASE}/guilds/${guildId}/config/tickets/feedback/setup` as const,
  pausing: (guildId: string, modul: "tickets" | "reports") =>
    `${API_BASE}/guilds/${guildId}/config/pausing/${modul}` as const,
  memberSearch: (guildId: string, query: string, filter?: "bot") =>
    `${API_BASE}/guilds/${guildId}/member-search?q=${encodeURIComponent(query)}${addFilterParam(filter)}` as const,
  ticketCategories: (guildId: string) => `${API_BASE}/guilds/${guildId}/config/tickets/categories` as const,
  ticketCategory: (guildId: string, categoryId: string) =>
    `${API_BASE}/guilds/${guildId}/config/tickets/categories/${categoryId}` as const,
  ticketFeedback: (guildId: string) => `${API_BASE}/guilds/${guildId}/config/tickets/feedback` as const,

  reports: (guildId: string) => `${API_BASE}/guilds/${guildId}/reports` as const,
  reportsConfig: (guildId: string) => `${API_BASE}/guilds/${guildId}/config/reports` as const,
};

const LegalLinks = {
  terms: "https://legal.supportmail.dev/terms",
  privacy: "https://legal.supportmail.dev/privacy",
  withdrawal: "https://legal.supportmail.dev/right-of-withdrawal",
  imprint: "https://legal.supportmail.dev/imprint",
} as const;

const DocsLinks = {
  LanguageDeterminationInGuild: "https://docs.supportmail.dev/f/preferences#language-determination-and-usage",
};

export { APIRoutes, cdnUrls, DISCORD_CDN_BASE, discordUrls, DocsLinks, LegalLinks };
