import { ChannelType } from "discord.js";
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

export function discordChannelTypeToBasic(type: ChannelType): "thread" | "channel" | "category" {
  if (type === ChannelType.PublicThread || type === ChannelType.PrivateThread) {
    return "thread";
  } else if (type === ChannelType.GuildCategory) {
    return "category";
  }
  return "channel";
}
