import { env as pubEnv } from "$env/dynamic/public";
import { RouteBases, Routes } from "discord-api-types/v10";

const DISCORD_CDN_BASE = RouteBases.cdn;
const API_BASE = "/api/v1" as const;
const API_GUILD_BASE = `${API_BASE}/guilds` as const;

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
    {
      guildId,
      state,
      addBot,
      wasLoggedIn,
    }: { guildId?: string; state?: string; addBot?: boolean; wasLoggedIn?: boolean } = {},
  ) {
    const url = new URL(Routes.oauth2Authorization(), this.base);
    const searchP = new URLSearchParams({
      client_id: pubEnv.PUBLIC_CLIENT_ID!,
    });

    if (addBot) {
      searchP.set("scope", "bot applications.commands");
      searchP.set("permissions", "1635040881911"); // https://discordapi.com/permissions.html#1635040881911
      searchP.set("integration_type", "0");
    } else {
      searchP.set("scope", "identify guilds guilds.members.read");
      searchP.set("response_type", "code");
      searchP.set("redirect_uri", origin + "/login/callback");
      if (wasLoggedIn) searchP.set("prompt", "none");
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
  guildEmoji: (emojiId: string, size = 72) =>
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
  guildChannels: (guildId: string, force = false) =>
    `${API_GUILD_BASE}/${guildId}/channels${force ? "?cache=false" : ""}` as const,
  guildChannel: (guildId: string, channelId: string) =>
    `${API_GUILD_BASE}/${guildId}/channels/${channelId}` as const,
  guildRoles: (guildId: string, force = false) =>
    `${API_GUILD_BASE}/${guildId}/roles${force ? "?cache=false" : ""}` as const,

  overview: (guildId: string) => `${API_GUILD_BASE}/${guildId}/config/overview` as const,

  tickets: (guildId: string) => `${API_GUILD_BASE}/${guildId}/tickets` as const,
  /**
   * Returns the URL for a specific guild's tickets configuration.
   */
  ticketsConfig: (guildId: string) => `${API_GUILD_BASE}/${guildId}/config/tickets` as const,
  ticketSetup: (guildId: string) => `${API_GUILD_BASE}/${guildId}/config/tickets/setup` as const,
  ticketFeedbackSetup: (guildId: string) =>
    `${API_GUILD_BASE}/${guildId}/config/tickets/feedback/setup` as const,
  memberSearch: (guildId: string, query: string, filter?: "bot") =>
    `${API_GUILD_BASE}/${guildId}/member-search?q=${encodeURIComponent(query)}${addFilterParam(filter)}` as const,
  ticketCategories: (guildId: string, partial?: boolean) =>
    `${API_GUILD_BASE}/${guildId}/config/tickets/categories${partial ? "?partial=true" : ""}` as const,
  ticketCategory: (guildId: string, categoryId: string) =>
    `${API_GUILD_BASE}/${guildId}/config/tickets/categories/${categoryId}` as const,
  ticketsFeedback: (guildId: string) => `${API_GUILD_BASE}/${guildId}/config/tickets/feedback` as const,
  ticketFeedback: (guildId: string, ticketId: string) =>
    `${API_GUILD_BASE}/${guildId}/tickets/${ticketId}/feedback` as const,
  resetTickets: (guildId: string) => `${API_GUILD_BASE}/${guildId}/config/tickets/reset` as const,
  syncTags: (guildId: string) => `${API_GUILD_BASE}/${guildId}/config/tickets/categories/sync-tags` as const,

  reports: (guildId: string) => `${API_GUILD_BASE}/${guildId}/reports` as const,
  reportsConfig: (guildId: string) => `${API_GUILD_BASE}/${guildId}/config/reports` as const,
  resetReports: (guildId: string) => `${API_GUILD_BASE}/${guildId}/config/reports/reset` as const,

  /**
   * Used for every blacklist operation.
   * - `GET` - Fetch all blacklist entries
   * - `POST` - Create a new blacklist entry
   * - `PUT` - Update an existing blacklist entry by `_id`
   *   - Expects a full blacklist entry object including `_id`
   * - `DELETE` - Delete one or more blacklist entries by `_id`
   *   - Expects `{ ids: string[] }` of ObjectIds to delete
   */
  blacklist: (guildId: string) => `${API_GUILD_BASE}/${guildId}/blacklist` as const,

  tags: (guildId: string, partial?: boolean) =>
    `${API_GUILD_BASE}/${guildId}/tags${partial ? "?partial=true" : ""}` as const,

  /**
   * Used for command configuration operations.
   * - `GET` - Fetch command configurations. Requires `path` or `id` query parameter. `path` allows partial matching (^). Path takes precedence over id.
   * - `PUT` - Create or update command configurations. Expects an array of command configuration objects. Doesn't need any query parameters.
   * - `DELETE` - Delete command configurations. Requires `path` or `id` query parameter. `path` allows partial matching (^). Path takes precedence over id.
   */
  commandConfig: (guildId: string, { path, id }: { path?: string; id?: string } = {}) => {
    const baseUrl = `${API_GUILD_BASE}/${guildId}/config/commands`;
    const searchParams = new URLSearchParams();
    if (path) searchParams.set("path", path);
    if (id) searchParams.set("id", id);
    const queryString = searchParams.toString();
    return `${baseUrl}?${queryString}`.replace(/\?$/, "");
  },

  panel: (guildId: string) => `${API_GUILD_BASE}/${guildId}/config/panel` as const,
  sendPanel: (guildId: string) => `${API_GUILD_BASE}/${guildId}/send-panel` as const,

  listGuildEmojis: (guildId: string) => `${API_GUILD_BASE}/${guildId}/emojis` as const,

  /**
   * Returns the URL for a specific guild.
   * 
   * Can only be used by mods and higher.
   */
  guild: (guildId: string) => `${API_GUILD_BASE}/${guildId}` as const,
};

const LegalLinks = {
  terms: "https://legal.supportmail.dev/terms",
  privacy: "https://legal.supportmail.dev/privacy",
  withdrawal: "https://legal.supportmail.dev/right-of-withdrawal",
  imprint: "https://legal.supportmail.dev/imprint",
} as const;

const DocsLinks = {
  LanguageDeterminationInGuild:
    "https://docs.supportmail.dev/getting-support/preferences/#how-language-is-determined",
  TicketCategories: "https://docs.supportmail.dev/configuration/ticket-categories/",
  EmojiMarkdownFormat: "https://docs.supportmail.dev/guides/emoji-markdown",
};

export { APIRoutes, cdnUrls, DISCORD_CDN_BASE, discordUrls, DocsLinks, LegalLinks };
