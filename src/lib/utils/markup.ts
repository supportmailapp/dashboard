import twemoji from "@discordapp/twemoji";
import { marked, type Token, type TokenizerAndRendererExtension, type Tokens } from "marked";
import { TwemojiRegex } from "./twemojiRegex";
import { escapeHtml } from "$lib/utils";

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
    return `<p><small>${this.parser.parseInline(tokens.tokens!)}</small></p>`;
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
        name: emojiMatch[2],
        animated: match[0].startsWith("<a:"),
        id: emojiMatch[3],
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

type AutolinkToken = Token & {
  type: "autolink";
  href: string;
};

const autolinkExtension: TokenizerAndRendererExtension<AutolinkToken, string> = {
  name: "autolink",
  level: "inline",
  start(src) {
    return src.match(/https?:\/\//)?.index;
  },
  tokenizer(src) {
    const match = /^(https?:\/\/[^\s<>\[\]()]+)/.exec(src);
    if (match) {
      return {
        type: "autolink",
        raw: match[0],
        href: match[1],
      };
    }
  },
  renderer(token) {
    return `<a href="${token.href}" target="_blank">${token.href}</a>`;
  },
};

function cleanUrl(href: string) {
  try {
    return encodeURI(href).replace(/%25/g, "%");
  } catch {
    return null;
  }
}

marked.use({
  renderer: {
    br(_: Tokens.Br): string {
      return `<br />`; // wit da space because it looks better
    },
    // from marked, but with our own cleanUrl and escapeHtml functions
    link({ href, title, tokens }: Tokens.Link) {
      const text = this.parser.parseInline(tokens) as string;
      const cleanHref = cleanUrl(href);
      if (cleanHref === null) {
        return text;
      }
      href = cleanHref;
      let out = '<a href="' + href + '" target="_blank"';
      if (title) {
        out += ' title="' + escapeHtml(title) + '"';
      }
      out += ">" + text + "</a>";
      return out;
    },
    codespan({ text }: Tokens.Codespan) {
      return `<code>${escapeHtml(text)}</code>`;
    },

    // stuff we don't want to render
    image({ raw }: Tokens.Image): string {
      return raw;
    },
    checkbox({ raw }: Tokens.Checkbox): string {
      return `<p>${raw}</p>`;
    },
    hr({ raw }: Tokens.Hr): string {
      return `<p>${raw}</p>`;
    },
    html({ text }: Tokens.HTML | Tokens.Tag): string {
      return text;
    },
    table({ raw }: Tokens.Table): string {
      return raw;
    },
    tablecell(_: Tokens.TableCell): string {
      return ""; // no raw available
    },
    tablerow(_: Tokens.TableRow<string>): string {
      return ""; // no raw available
    },
    def({ raw }: Tokens.Def): string {
      return `<p>${raw}</p>`;
    },
    space() {
      return "<br />"; // Somehow, "\n\n" in markdown becomes a space token? So we convert it to a line break
    },
  },
  extensions: [
    underlineExtension,
    subtextExtension,
    spoilerExtension,
    customemojiExtension,
    ...(mentionExtensions as TokenizerAndRendererExtension[]), // gotta assert because TS will freak out
    twemojiExtension,
    autolinkExtension,
  ],
  breaks: true,
});

export function discordMdToHtml(message: string) {
  return marked(message, {});
}
