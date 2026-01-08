import twemoji from "@discordapp/twemoji";
import { marked, type Token, type TokenizerAndRendererExtension, type Tokens } from "marked";
import { TwemojiRegex } from "./twemojiRegex";

// extensions for marked

const customRules = {
  underline: { full: /^__([\s\S]+?)__/, start: /^__/ },
  customemoji: { full: /^(<a?:(\w+):([0-9]{17,21})>)/, start: /<a?:\w+:[0-9]{17,21}>/ },
  subtext: { full: /^-# +([^\n]+?)(?:\n|$)/, start: /^-# / },
  spoiler: { full: /^\|\|([\s\S]+?)\|\|/, start: /\|\|/ },
  usermention: { full: /^<@?([0-9]{17,21})>/, start: /^<@?/ },
  rolemention: { full: /^<@&([0-9]{17,21})>/, start: /^<@&/ },
  channelmention: { full: /^<#([0-9]{17,21})>/, start: /^<#/ },
  serverguidemention: { full: /^<id:(guide|home)>/, start: /^<id:/ },
  customizemention: { full: /^<id:customize>/, start: /^<id:/ },
  browsemention: { full: /^<id:browse>/, start: /^<id:/ },
  // regex for command name is from discord docs
  slashcommandmention: {
    full: /^<\/([-_'\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}):([0-9]{17,21})>/u,
    start: /^<\/([-_'\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}):/u,
  },
  everyoneHere: { full: /^@(everyone|here)/, start: /^@/ },
};

type UnderlineToken = Token & {
  type: "underline";
  text: string;
  tokens?: Token[];
};

const underlineExtension: TokenizerAndRendererExtension<UnderlineToken, string> = {
  name: "underline",
  level: "inline",
  start(src) {
    return src.match(customRules.underline.start)?.index;
  },
  tokenizer(src, tokens) {
    const match = customRules.underline.full.exec(src);
    if (match) {
      return {
        type: "underline",
        raw: match[0],
        text: match[1],
        tokens: this.lexer.inlineTokens(match[1]),
      };
    }
  },
  renderer(tokens) {
    return `<u>${this.parser.parseInline(tokens.tokens!)}</u>`;
  },
};

type SubtextToken = Token & {
  type: "subtext";
  text: string;
  tokens?: Token[];
};

const subtextExtension: TokenizerAndRendererExtension<SubtextToken, string> = {
  name: "subtext",
  level: "block",
  start(src) {
    return src.match(customRules.subtext.start)?.index;
  },
  tokenizer(src, tokens) {
    const match = customRules.subtext.full.exec(src);
    if (match) {
      return {
        type: "subtext",
        raw: match[0],
        text: match[1],
        tokens: this.lexer.inlineTokens(match[1]),
      };
    }
  },
  renderer(tokens) {
    return `<small>${this.parser.parseInline(tokens.tokens!)}</small>`;
  },
};

type SpoilerToken = Token & {
  type: "spoiler";
  tokens?: Token[]; // Spoilers can be multiline and contain other markdown - so no text field
};

const spoilerExtension: TokenizerAndRendererExtension<SpoilerToken, string> = {
  name: "spoiler",
  level: "inline",
  start(src) {
    return src.match(customRules.spoiler.start)?.index;
  },
  tokenizer(src, tokens) {
    const match = customRules.spoiler.full.exec(src);
    if (match) {
      return {
        type: "spoiler",
        raw: match[0],
        tokens: this.lexer.inlineTokens(match[1]),
      };
    }
  },
  renderer(token) {
    return `<span class="spoiler">${this.parser.parseInline(token.tokens!)}</span>`;
  },
};

type CustomemojiToken = Token & {
  type: "customemoji";
  name: string;
  animated: boolean;
  id: string;
};

const customemojiExtension: TokenizerAndRendererExtension<CustomemojiToken, string> = {
  name: "customemoji",
  level: "inline",
  start(src) {
    return src.match(customRules.customemoji.start)?.index;
  },
  tokenizer(src, tokens) {
    const match = customRules.customemoji.full.exec(src);
    if (match) {
      const emojiMatch = customRules.customemoji.full.exec(match[0])!;
      return {
        type: "customemoji",
        raw: match[0],
        name: emojiMatch[1],
        animated: match[0].startsWith("<a:"),
        id: emojiMatch[2],
      };
    }
  },
  renderer(token) {
    const url = `https://cdn.discordapp.com/emojis/${token.id}.webp`;
    return `<img class="inline-image" data-id="${token.id}" alt="${token.name}" title="${token.name}" src="${url}" />`;
  },
};

type MentionToken = Token & {
  id: string;
  name?: string;
};

type UserMentionToken = MentionToken & {
  type: "usermention";
};

type RoleMentionToken = MentionToken & {
  type: "rolemention";
};

type ChannelMentionToken = MentionToken & {
  type: "channelmention";
};

type ServerguideMentionToken = MentionToken & {
  type: "serverguidemention";
};

type CustomizeMentionToken = MentionToken & {
  type: "customizemention";
};

type BrowseMentionToken = MentionToken & {
  type: "browsemention";
};

type SlashcommandMentionToken = Required<MentionToken> & {
  type: "slashcommandmention";
};

type EveryoneHereMentionToken = Required<Omit<MentionToken, "id">> & {
  type: "hereEveryone";
};

type AnyMentionToken =
  | UserMentionToken
  | RoleMentionToken
  | ChannelMentionToken
  | ServerguideMentionToken
  | CustomizeMentionToken
  | BrowseMentionToken
  | SlashcommandMentionToken
  | EveryoneHereMentionToken;

const mentionExtensions: TokenizerAndRendererExtension<AnyMentionToken, string>[] = [
  {
    name: "usermention",
    level: "inline",
    start(src) {
      return src.match(customRules.usermention.start)?.index;
    },
    tokenizer(src, tokens) {
      const match = customRules.usermention.full.exec(src);
      if (match) {
        return {
          type: "usermention",
          raw: match[0],
          id: match[1],
        };
      }
    },
    renderer(token) {
      return `<span data-slot="mention-container" data-id="${token.id}">@${token.id}</span>`;
    },
  },
  {
    name: "rolemention",
    level: "inline",
    start(src) {
      return src.match(customRules.rolemention.start)?.index;
    },
    tokenizer(src, tokens) {
      const match = customRules.rolemention.full.exec(src);
      if (match) {
        return {
          type: "rolemention",
          raw: match[0],
          id: match[1],
        };
      }
    },
    renderer(token) {
      return `<span data-slot="mention-container" data-id="${token.id}">@${token.id}</span>`;
    },
  },
  {
    name: "channelmention",
    level: "inline",
    start(src) {
      return src.match(customRules.channelmention.start)?.index;
    },
    tokenizer(src, tokens) {
      const match = customRules.channelmention.full.exec(src);
      if (match) {
        return {
          type: "channelmention",
          raw: match[0],
          id: match[1],
        };
      }
    },
    renderer(token) {
      return `<span data-slot="mention-container" data-id="${token.id}">#${token.id}</span>`;
    },
  },
  {
    name: "serverguidemention",
    level: "inline",
    start(src) {
      return src.match(customRules.serverguidemention.start)?.index;
    },
    tokenizer(src, tokens) {
      const match = customRules.serverguidemention.full.exec(src);
      if (match) {
        return {
          type: "serverguidemention",
          raw: match[0],
          id: match[1],
        };
      }
    },
    renderer(token) {
      return `<span data-slot="mention-container" class="mention-guide">Server Guide</span>`;
    },
  },
  {
    name: "customizemention",
    level: "inline",
    start(src) {
      return src.match(customRules.customizemention.start)?.index;
    },
    tokenizer(src, tokens) {
      const match = customRules.customizemention.full.exec(src);
      if (match) {
        return {
          type: "customizemention",
          raw: match[0],
          id: "customize",
        };
      }
    },
    renderer(token) {
      return `<span data-slot="mention-container" class="mention-customize">Channels & Roles</span>`;
    },
  },
  {
    name: "browsemention",
    level: "inline",
    start(src) {
      return src.match(customRules.browsemention.start)?.index;
    },
    tokenizer(src, tokens) {
      const match = customRules.browsemention.full.exec(src);
      if (match) {
        return {
          type: "browsemention",
          raw: match[0],
          id: "browse",
        };
      }
    },
    renderer(token) {
      return `<span data-slot="mention-container" class="mention-browse">Browse Channels</span>`;
    },
  },
  {
    name: "slashcommandmention",
    level: "inline",
    start(src) {
      return src.match(customRules.slashcommandmention.start)?.index;
    },
    tokenizer(src, tokens) {
      const match = customRules.slashcommandmention.full.exec(src);
      if (match) {
        return {
          type: "slashcommandmention",
          raw: match[0],
          name: match[1],
          id: match[2],
        };
      }
    },
    renderer(token) {
      return `<span data-slot="mention-container" class="mention-slash" data-id="${token.id}">/${token.name}</span>`;
    },
  },
  {
    name: "hereEveryone",
    level: "inline",
    start(src) {
      return src.match(customRules.everyoneHere.start)?.index;
    },
    tokenizer(src, tokens) {
      const match = customRules.everyoneHere.full.exec(src);
      if (match) {
        return {
          type: "hereEveryone",
          raw: match[0],
          name: match[1],
        };
      }
    },
    renderer(token) {
      return `<span data-slot="mention-container">@${token.name}</span>`;
    },
  },
];

type UnicodeEmojiToken = Token & {
  type: "unicodeemoji";
  emoji: string;
};

const twemojiExtension: TokenizerAndRendererExtension<UnicodeEmojiToken, string> = {
  name: "unicodeemoji",
  level: "inline",
  start(src) {
    return src.match(TwemojiRegex())?.index;
  },
  tokenizer(src, tokens) {
    /*
    twemoji.parse parses the WHOLE entire HTML string and... returns a parsed version with emojis replaced
    with imgs
    So we have to first test if there's any emoji in the src at all, and only then parse it
    However, because discord doesn't expose an option to only parse it the whole string is a twemoji,
    we have to return the whole string as raw and emoji and replace newlines with linebreaks
    TODO: Submit a PR to twemoji to add an option to only parse if the whole string is an emoji
    */
    const contains = twemoji.test(src);
    // TODO: Report issue to marked.js that we can't use Buffer.from in here because its not defined??
    if (contains) {
      return {
        type: "unicodeemoji",
        raw: src,
        emoji: twemoji.parse(src, { className: "inline-image" }).replace(/\n/g, "<br />"),
      };
    }
  },
  renderer(token) {
    return token.emoji;
  },
};

marked.use({
  renderer: {
    blockquote({ tokens }: Tokens.Blockquote): string {
      return `<blockquote>${this.parser.parseInline(tokens)}</blockquote>\n`;
    },
    strong({ tokens }: Tokens.Strong): string {
      return `<strong>${this.parser.parseInline(tokens)}</strong>`;
    },
    br(_: Tokens.Br): string {
      return `<br />`;
    },
    codespan({ text }: Tokens.Codespan): string {
      return `<code>${text}</code>`;
    },
    code({ text, lang }: Tokens.Code): string {
      return `<pre><code class="language-${lang ?? ""}">${text}</code></pre>`;
    },
    em({ tokens }: Tokens.Em): string {
      return `<em>${this.parser.parseInline(tokens)}</em>`;
    },
    del({ tokens }: Tokens.Del): string {
      return `<del>${this.parser.parseInline(tokens)}</del>`;
    },
    checkbox(_: Tokens.Checkbox): string {
      return "";
    },
    link({ href, title, tokens }: Tokens.Link): string {
      return `<a href="${href}" target="_blank" title="${title ?? ""}">${this.parser.parseInline(tokens)}</a>`;
    },
    heading({ tokens, depth }: Tokens.Heading): string {
      if (depth >= 1 && depth <= 3) {
        return `<h${depth}>${this.parser.parseInline(tokens)}</h${depth}>`;
      }
      return new Array(depth).fill(() => "#").join("") + " " + this.parser.parseInline(tokens);
    },
    text(token: Tokens.Text | Tokens.Escape): string {
      return "tokens" in token && token.tokens ? this.parser.parseInline(token.tokens) : token.text;
    },
    list({ items, ordered, start }: Tokens.List): string {
      const listTag = ordered ? "ol" : "ul";
      const startAttr = ordered && start !== 1 ? ` start="${start}"` : "";
      const listItems = items.map((item) => this.listitem!(item)).join("\n");
      return `<${listTag}${startAttr}>\n${listItems}\n</${listTag}>\n`;
    },
    listitem({ tokens }: Tokens.ListItem): string {
      return `<li>${this.parser.parseInline(tokens)}</li>`;
    },
    paragraph({ tokens }: Tokens.Paragraph): string {
      return `<p>${this.parser.parseInline(tokens)}</p>\n`;
    },
    image(_: Tokens.Image): string {
      return "";
    },
    hr(_: Tokens.Hr): string {
      return "";
    },
    html({ text }: Tokens.HTML | Tokens.Tag): string {
      return text;
    },
    table(_: Tokens.Table): string {
      return "";
    },
    tablecell(_: Tokens.TableCell): string {
      return "";
    },
    tablerow(_: Tokens.TableRow<string>): string {
      return "";
    },
    def(_: Tokens.Def): string {
      return "";
    },
    space(_: Tokens.Space): string {
      return "";
    },
  },
  extensions: [
    underlineExtension,
    subtextExtension,
    spoilerExtension,
    customemojiExtension,
    ...(mentionExtensions as TokenizerAndRendererExtension[]), // gotta assert because TS will freak out
    twemojiExtension,
  ],
  breaks: true,
});

export function toDiscordHtml(message: string) {
  return marked(message);
}
