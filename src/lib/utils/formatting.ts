import { ChannelType, type APIGuildCategoryChannel, type APIUser } from "discord-api-types/v10";
import type { IPartialEmoji } from "supportmail-types";

/**
 * Sorts an array of items by their position property in ascending order.
 * If two items have the same position, they are sorted by their id property in lexicographical order.
 *
 * @template T - The type of the objects, which must include `id` and `position` properties.
 * @param {T[]} items - The array of items to be sorted.
 * @returns {T[]} A new array of items sorted by position and id.
 */
export function sortByPositionAndId<T extends { id: string; position: number }>(items: T[]): T[] {
  return items.slice().sort((a, b) => {
    if (a.position === b.position) {
      return b.id.localeCompare(a.id);
    }
    return b.position - a.position;
  });
}

export function sortChannels<T extends GuildCoreChannel>(channels: T[], preserveCategoryGroups?: false): T[];
export function sortChannels<T extends GuildCoreChannel>(
  channels: T[],
  preserveCategoryGroups: true,
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
): any {
  const sorted = sortByPositionAndId(channels);

  if (!preserveCategoryGroups) {
    const grouped: T[] = [];
    // First all uncategorized channels
    for (const channel of sorted) {
      if (channel.parent_id === null && channel.type !== ChannelType.GuildCategory) {
        grouped.push(channel);
      }
    }

    const categories = sorted.filter((c) => c.type === ChannelType.GuildCategory);
    for (const cat of categories) {
      grouped.push(cat, ...channels.filter((c) => c.parent_id === cat.id));
    }
    return grouped;
  }

  // Group channels by category
  const categories = sorted.filter((c) => c.type === ChannelType.GuildCategory) as APIGuildCategoryChannel[];
  const result: {
    uncategorized: T[];
    categories: { cat: APIGuildCategoryChannel; channels: Exclude<T, APIGuildCategoryChannel>[] }[];
  } = {
    uncategorized: sorted.filter((c) => c.parent_id === null && c.type !== ChannelType.GuildCategory) as T[],
    categories: categories.map((cat) => ({
      cat,
      channels: sorted.filter(
        (c) => c.parent_id === cat.id && c.type !== ChannelType.GuildCategory,
      ) as Exclude<T, APIGuildCategoryChannel>[],
    })),
  };

  console.log("Sorted channels:", result);

  return result;
}

export function numberToHex(number: number): string {
  return number.toString(16).padStart(6, "0");
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

export function userDisplayName(user?: APIUser | null): string {
  return !!user ? user.global_name || user.username : "Unknown User";
}

export class MarkdownFormatter {
  constructor(private text: string) {}

  /**
   * Converts the text to HTML, escaping any unsafe characters.
   * @returns The HTML formatted text.
   */
  toHTML(): string {
    // Escape unsafe characters
    const escapedText = this.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // Convert markdown to HTML (simple implementation)
    return escapedText
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
      .replace(/__(.*?)__/g, "<strong>$1</strong>") // Bold
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic
      .replace(/_(.*?)_/g, "<em>$1</em>") // Italic
      .replace(/`(.*?)`/g, "<code>$1</code>") // Inline code
      .replace(/\n/g, "<br>") // New lines to <br>
      .replace(/\[([^\]]+)\]\(([^) ]+)\)/gi, `<a href="$2" class="md-link" target="_blank">$1</a>`);
  }
}

export class EmojiParser {
  private static unicodeRE(): RegExp {
    const r = String.raw;
    const seq = r`(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation})`;
    const sTags = r`\u{E0061}-\u{E007A}`;
    return new RegExp(
      r`^([\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[${sTags}]{2}[\u{E0030}-\u{E0039}${sTags}]{1,3}\u{E007F}|${seq}(?:\u200D${seq})*)$`,
      "u",
    );
  }

  private static readonly customEmojiRegex = /^<?(?:(a))?:([a-zA-Z0-9_~]{2,32}):(\d{17,19})>?$/i;

  static fromString(emojiStr: string, withFallback: true): IPartialEmoji;
  static fromString(emojiStr: string, withFallback?: false): IPartialEmoji | null;
  static fromString(emojiStr: string, withFallback?: boolean): IPartialEmoji | null {
    // First try to match custom emoji
    const customEmoji = emojiStr.match(this.customEmojiRegex);
    if (customEmoji) {
      return {
        animated: Boolean(customEmoji[1]),
        name: customEmoji[2],
        id: customEmoji[3],
      };
    }

    // Then try to match unicode emoji
    const m = emojiStr.match(this.unicodeRE());
    if (m?.[0]) return { name: m[0] };

    return withFallback ? { name: emojiStr } : null;
  }

  static toString(emoji: IPartialEmoji): string {
    if (emoji.id) {
      return `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`;
    }
    return emoji.name || "";
  }

  static isCustom(emoji: IPartialEmoji): emoji is IPartialEmoji & { id: string; name: string } {
    return !!emoji.id && emoji.name.length > 0;
  }

  static isValid(emoji: IPartialEmoji): boolean {
    return this.isCustom(emoji) || (!!emoji.name && this.unicodeRE().test(emoji.name));
  }
}
