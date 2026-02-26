import {
  ButtonStyle,
  ChannelType,
  ComponentType,
  type APIComponentInActionRow,
  type APIGuildCategoryChannel,
  type APIMessageTopLevelComponent,
  type APIUser,
  type APIComponentInMessageActionRow,
  type APIComponentInContainer,
  type APIMediaGalleryItem,
  type APIThumbnailComponent,
  type APIButtonComponentWithCustomId,
  type APIButtonComponentWithURL,
  type APISectionAccessoryComponent,
} from "discord-api-types/v10";
import { FullTwemojiRegex } from "./twemojiRegex";
import type {
  IPartialEmoji,
  SMActionRowButton,
  SMComponentInActionRow,
  SMCustomAction,
  SMMediaItem,
  SMThumbnailComponent,
  SMTopLevelMessageComponent,
} from "$lib/sm-types";

/**
 * Sorts an array of items by their position property in ascending order using Discord's sorting approach.
 * If two items have the same position, they are sorted by their id property as BigInt.
 *
 * @template T - The type of the objects, which must include `id` and `position` properties.
 * @param {T[]} items - The array of items to be sorted.
 * @returns {T[]} A new array of items sorted by position and id.
 */
export function sortByPositionAndId<T extends { id: string; position: number }>(
  items: T[],
  highestFirst: boolean = true,
): T[] {
  return items.slice().sort((a, b) => {
    if (a.position !== b.position) {
      return highestFirst ? b.position - a.position : a.position - b.position;
    }
    // Use BigInt for accurate large number comparison
    if (highestFirst) return Number(BigInt(b.id) - BigInt(a.id));
    else return Number(BigInt(a.id) - BigInt(b.id));
  });
}

/**
 * Sorts channels within a category by organizing them with text channels first, followed by voice channels.
 *
 * @template T - A channel object type that extends `{ type: ChannelType; id: string; position: number }`
 * @param channels - Array of channels to sort
 * @returns A new array of sorted channels with text/other channels before voice and stage voice channels
 */
function sortChannelsInCategory<T extends { type: ChannelType; id: string; position: number }>(
  channels: T[],
) {
  // Sort channels within a category by position and id
  const sorted1 = sortByPositionAndId(channels);
  // Move voice channels to the end
  const voiceChannels = sorted1.filter((c) =>
    [ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(c.type),
  );
  const otherChannels = sorted1.filter(
    (c) => ![ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(c.type),
  );
  return [...otherChannels, ...voiceChannels];
}

export function sortChannels<T extends GuildCoreChannel>(
  channels: T[],
  preserveCategoryGroups?: false,
  logFn?: (arg: any) => any,
): T[];
export function sortChannels<T extends GuildCoreChannel>(
  channels: T[],
  preserveCategoryGroups: true,
  logFn?: (arg: any) => any,
): {
  uncategorized: Exclude<T, APIGuildCategoryChannel>[];
  categories: { cat: APIGuildCategoryChannel; channels: Exclude<T, APIGuildCategoryChannel>[] }[];
};
/**
 * Sorts an array of channels by position and groups them by category if preserveCategoryGroups is true.
 * When preserveCategoryGroups is false, returns a flat array with categories and their channels in order.
 * When preserveCategoryGroups is true, returns grouped objects with category and its channels.
 */
export function sortChannels<T extends GuildCoreChannel>(
  channels: T[],
  preserveCategoryGroups: boolean = false,
  logFn?: (arg: any) => any,
): any {
  const sortedCategories = sortByPositionAndId(
    channels.filter((c) => c.type === ChannelType.GuildCategory) as APIGuildCategoryChannel[],
  );
  if (!preserveCategoryGroups) {
    const grouped: T[] = [];
    // First all uncategorized channels
    grouped.push(
      ...sortChannelsInCategory(
        channels.filter((c) => c.parent_id === null && c.type !== ChannelType.GuildCategory),
      ),
    );

    for (const cat of sortedCategories) {
      grouped.push(cat as T, ...(channels.filter((c) => c.parent_id === cat.id) as T[]));
    }
    return grouped;
  }

  // Group channels by category
  const result: {
    uncategorized: T[];
    categories: { cat: APIGuildCategoryChannel; channels: Exclude<T, APIGuildCategoryChannel>[] }[];
  } = {
    uncategorized: sortChannelsInCategory(
      channels.filter((c) => !c.parent_id && c.type !== ChannelType.GuildCategory) as T[],
    ),
    categories: sortedCategories.map((cat) => ({
      cat,
      channels: sortChannelsInCategory(
        channels.filter((c) => c.parent_id === cat.id) as Exclude<T, APIGuildCategoryChannel>[],
      ),
    })),
  };

  logFn?.(result);

  return result;
}

export function numberToHex(number: number, withHashtag: boolean = false): string {
  return (withHashtag ? "#" : "") + number.toString(16).padStart(6, "0");
}

export function hexToNumber(hex: string): number {
  return parseInt(hex, 16);
}

export function clipTextToLength(text: string, maxLength: number = 30): string {
  return text.slice(0, maxLength) + (text.length > maxLength ? "..." : "");
}

type FormatNumberOptions =
  | {
      step?: number;
      roundUp?: boolean;
      plus?: boolean;
      comma?: boolean;
    }
  | undefined;

/**
 * Format a large number with commas and a '+' sign.
 * For example, 1234567 becomes "1,234,500+"
 *
 * @param num - The number to format.
 * @param step - The step to round down to. Default is 100.
 * @returns The formatted number as a string.
 */
export function roundAndFormatNumber(num: number, opts: FormatNumberOptions = {}): string {
  const options = Object.assign({}, { step: 100, roundUp: false, plus: true, comma: true }, opts) as Required<
    typeof opts
  >;
  // Round down to nearest step
  if (options.roundUp) {
    num = Math.ceil(num / options.step) * options.step;
  } else {
    num = Math.floor(num / options.step) * options.step;
  }

  // Format with commas + '+'
  let formattedNumber = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (!options.comma) {
    formattedNumber = formattedNumber.replace(/,/g, "");
  }
  return formattedNumber + (options.plus ? "+" : "");
}

export function userDisplayName(
  user?: (Record<string, any> & Pick<APIUser, "global_name" | "username">) | null,
): string {
  return !!user ? user.global_name || user.username : "Unknown User";
}

export const CustomEmojiRegex = /^<?(a)?:([a-zA-Z0-9_~]{2,32}):(\d{17,23})>?$/i;

/**
 * Validates and parses emoji from a text string.
 * Attempts to match both custom Discord-style emojis and Twemoji formats.
 *
 * @param text - The text string to validate for emoji content
 * @returns An object containing emoji properties (animated, name, id) if a valid emoji is found, otherwise undefined
 *
 * @example
 * // Custom emoji
 * validateEmoji('<a:name:123456789>'); // { animated: true, name: 'name', id: '123456789' }
 *
 * @example
 * // Twemoji
 * validateEmoji('😀'); // { name: '😀' }
 *
 * @example
 * // Invalid emoji
 * validateEmoji(''); // undefined
 */
export function validateEmoji(text: string): IPartialEmoji | undefined {
  if (!text || text.length == 0) return;
  text = text.trim();
  const customEmoji = text.match(CustomEmojiRegex);
  if (customEmoji) {
    return { animated: !!customEmoji[1], name: customEmoji[2], id: customEmoji[3] };
  }

  const twemojiMatch = text.match(FullTwemojiRegex())?.[0];
  if (twemojiMatch) {
    return { name: twemojiMatch };
  }
  return;
}

/**
 * Indexes an array of objects by a specified key, re-indexing the key to be sequential starting from a given value.
 *
 * @param arr - The array to index. Must be pre-sorted, just not sequentially!
 * @param key - The key to index by.
 * @param start - The starting index value (default is 1).
 * @template T - The type of the objects in the array.
 * @template K - The key type of the objects in the array.
 * @returns The indexed array or undefined if the input is invalid.
 */
export function reindexArrayByKey<T, K extends keyof T>(
  arr: T[] | undefined | null,
  key: K,
  start: number = 1,
): T[] | undefined {
  if (Array.isArray(arr)) {
    for (let i = 0; i < arr.length; i++) {
      (arr[i][key] as any) = i + start; // Re-index fields starting from 0 or 1
    }
  }
  return arr ?? undefined;
}

export function dateToLocalString(date: Date | string): string {
  if (typeof date === "string") {
    date = new Date(date);
  }
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function parseDiscordLink(
  url: string,
): { guildId: string; channelId?: string; messageId?: string } | null {
  let _url: URL;
  try {
    _url = new URL(url);
  } catch {
    return null;
  }
  const path = _url.pathname;
  const pathRegex = /^\/channels\/(\d+)(?:\/(\d+)(?:\/(\d+))?)?$/;
  const match = path.match(pathRegex);
  if (!match) return null;
  return {
    guildId: match[1],
    channelId: match[2],
    messageId: match[3],
  };
}

export class ComponentParser {
  static readonly ButtonActionMapping = {
    "ticket:create": "createTicket/panel",
    reply: "replyTo",
  } as const satisfies Record<Exclude<SMCustomAction, "link">, string>;
  static readonly SelectOptionActionMapping = {
    "ticket:create": "createTicket",
    reply: "replyTo",
  } as const satisfies Record<Exclude<SMCustomAction, "link">, string>;
  private categories: string[];
  private tags: string[];

  constructor(
    private components: SMTopLevelMessageComponent[],
    additional: { categories?: string[]; tags?: string[] } = {},
  ) {
    this.categories = additional.categories ?? [];
    this.tags = additional.tags ?? [];
  }

  parse(): APIMessageTopLevelComponent[] {
    return this.components.map((comp) => this.parseComponent(comp)).filter((c) => c != undefined);
  }

  private parseComponent(comp: SMTopLevelMessageComponent): APIMessageTopLevelComponent | undefined {
    switch (comp.type) {
      case ComponentType.ActionRow:
        return {
          type: comp.type,
          components: comp.components
            .map((c) => this.parseComponentInActionRow(c))
            .filter((c) => c != undefined),
        };
      case ComponentType.Container:
        return {
          type: comp.type,
          components: comp.components.map((c) => this.parseComponentInContainer(c)),
          accent_color: comp.accent_color,
          spoiler: !!comp.spoiler,
        };
      case ComponentType.MediaGallery:
        return {
          type: comp.type,
          items: comp.items.map((item) => this.parseMediaItem(item)),
        };
      case ComponentType.Section:
        if (!comp.accessory) {
          return undefined; // a sections needs an accessory
        }
        const accessory = this.parseSectionAccessory(comp.accessory);
        if (!accessory) {
          return undefined; // invalid accessory
        }
        return {
          type: comp.type,
          components: comp.components.map((c) => ({ type: ComponentType.TextDisplay, content: c.content })),
          accessory: accessory,
        };
      case ComponentType.Separator:
        return {
          type: comp.type,
          divider: !!comp.divider,
          spacing: comp.spacing,
        };
      case ComponentType.TextDisplay:
        return {
          type: comp.type,
          content: comp.content,
        };
    }
  }

  private parseComponentInContainer(comp: SMTopLevelMessageComponent): APIComponentInContainer {
    // the same as parseComponent but without the Container type, so we can just call it recursively
    return this.parseComponent(comp) as APIComponentInContainer;
  }

  private parseButton(
    comp: SMActionRowButton,
  ): APIButtonComponentWithCustomId | APIButtonComponentWithURL | undefined {
    if (comp.style === ButtonStyle.Link && comp.action === "link") {
      return {
        type: ComponentType.Button,
        style: 5,
        label: comp.label,
        emoji: comp.emoji ? validateEmoji(comp.emoji) : undefined,
        url: comp.url,
        disabled: comp.disabled,
      };
    } else if (comp.style !== ButtonStyle.Link && comp.action !== "link") {
      if (
        (comp.action === "ticket:create" &&
          !!comp.custom_id &&
          !this.categories.includes(comp.custom_id ?? "")) ||
        (comp.action === "reply" && !this.tags.includes(comp.custom_id ?? ""))
      ) {
        return undefined; // invalid action/category
      }
      const actionPrefix = ComponentParser.ButtonActionMapping[comp.action];
      return {
        type: ComponentType.Button,
        style: comp.style,
        label: comp.label,
        emoji: comp.emoji ? validateEmoji(comp.emoji) : undefined,
        custom_id: `${actionPrefix}${comp.custom_id ? `/${comp.custom_id}` : ""}`,
        disabled: comp.disabled,
      };
    }
    return undefined;
  }

  private parseComponentInActionRow(
    comp: SMComponentInActionRow,
  ): Extract<APIComponentInMessageActionRow, { type: SMComponentInActionRow["type"] }> | undefined {
    if (comp.type === ComponentType.Button) {
      return this.parseButton(comp);
    }

    return {
      type: comp.type,
      custom_id: "panelSelect",
      options: comp.options.map((opt) => ({
        label: opt.label,
        value: `${ComponentParser.SelectOptionActionMapping[opt.action]}${opt.value ? `/${opt.value}` : ""}`,
        description: opt.description,
        emoji: opt.emoji ? validateEmoji(opt.emoji) : undefined,
      })),
      placeholder: comp.placeholder,
    };
  }

  private parseMediaItem(item: SMMediaItem, asThumbnail: true): APIThumbnailComponent;
  private parseMediaItem(item: SMMediaItem, asThumbnail?: false): APIMediaGalleryItem;
  private parseMediaItem(
    item: SMMediaItem,
    asThumbnail: boolean = false,
  ): APIThumbnailComponent | APIMediaGalleryItem {
    if (asThumbnail) {
      return {
        type: ComponentType.Thumbnail,
        media: { url: item.url },
        description: item.description,
        spoiler: !!item.spoiler,
      };
    }
    return {
      media: { url: item.url },
      description: item.description,
      spoiler: !!item.spoiler,
    };
  }

  private parseSectionAccessory(
    comp: SMActionRowButton | SMThumbnailComponent,
  ): APISectionAccessoryComponent | undefined {
    if (comp.type === ComponentType.Button) {
      return this.parseButton(comp);
    }
    return this.parseMediaItem(comp, true);
  }
}
