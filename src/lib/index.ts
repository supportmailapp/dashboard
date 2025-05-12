import { ChannelType } from "discord-api-types/v10";
import type { IDBGuild } from "supportmail-types";

export function turnGuildConfigIntoOverview(_config: IDBGuild & { _id: string }) {
  return {
    _id: _config._id,
    id: _config.id,
    name: _config.name,
    icon: _config.icon,
    lang: _config.lang,
    ticketForum: _config.ticketConfig.forumId,
    alertChannel: _config.reportConfig.channelId,
  };
}

export type ConfigOverview = ReturnType<typeof turnGuildConfigIntoOverview>;

export * from "./utils/validators";

export function delay(ms: number) {
  return new Promise((_r) => setTimeout(_r, ms));
}

export function discordChannelTypeToBasic(type: ChannelType): "thread" | "channel" | "category" | "voice" {
  if (type === ChannelType.PublicThread || type === ChannelType.PrivateThread) {
    return "thread";
  } else if (type === ChannelType.GuildCategory) {
    return "category";
  } else if (type === ChannelType.GuildVoice) {
    return "voice";
  }
  return "channel";
}

/**
 * Compares a Discord channel type against a basic channel type category
 *
 * @param discord - The Discord ChannelType enum value to compare
 * @param basic - A simplified channel type: "thread", "channel", "category" or "voice"
 * @returns True if the Discord channel type matches the specified basic channel type, false otherwise
 *
 * - For "category", returns true if the Discord channel type is GuildCategory
 * - For "thread", returns true if the Discord channel type is PublicThread or PrivateThread
 * - For "channel", returns true if the Discord channel type is neither a category nor a thread
 * - For "voice", returns true if the Discord channel type is GuildVoice or GuildStageVoice
 */
export function compareChannelTypes(discord: ChannelType, basic: "thread" | "channel" | "category" | "voice") {
  if (discord === ChannelType.GuildCategory) {
    return basic === "category";
  } else if (discord === ChannelType.PublicThread || discord === ChannelType.PrivateThread) {
    return basic === "thread";
  } else if (discord === ChannelType.GuildVoice || discord === ChannelType.GuildStageVoice) {
    return basic === "voice";
  }

  return basic === "channel";
}
