// src/lib/discordMarkdown.ts
import { marked, Renderer, type Token, type TokenizerAndRendererExtension, type Tokens } from "marked";

// Overwrites for everything else, because the renderer needs to be told to use custom elements for those too
class SMRenderer extends Renderer {
  blockquote({ tokens }: Tokens.Blockquote): string {
    return `<discord-quote>${this.parser.parseInline(tokens)}</discord-quote>\n`;
  }
  strong({ tokens }: Tokens.Strong): string {
    return `<discord-strong>${this.parser.parseInline(tokens)}</discord-strong>\n`;
  }
  br(_: Tokens.Br): string {
    return `<br />`;
  }
  codespan({ text }: Tokens.Codespan): string {
    return `<discord-code>${text}</discord-code>`;
  }
  code({ text, lang }: Tokens.Code): string {
    return `<discord-code multiline language="${lang ?? ""}">${text}</discord-code>`;
  }
  em({ tokens }: Tokens.Em): string {
    return `<discord-italic>${this.parser.parseInline(tokens)}</discord-italic>`;
  }
  del({ tokens }: Tokens.Del): string {
    return `<discord-strikethrough>${this.parser.parseInline(tokens)}</discord-strikethrough>`;
    // not from the package used to parse this output, we gotta write our own css for this
  }
  checkbox(_: Tokens.Checkbox): string {
    return "";
  }
  link({ href, title, tokens }: Tokens.Link): string {
    return `<discord-link href="${href}" target="_blank" title="${title ?? ""}">${this.parser.parseInline(tokens)}</discord-link>`;
  }
  heading({ tokens, depth }: Tokens.Heading): string {
    if (depth >= 1 && depth <= 3) {
      return `<discord-header level="${depth}">${this.parser.parseInline(tokens)}</discord-header>`;
    }
    // dont allow headings above h3
    return new Array(depth).fill(() => "#").join("") + " " + this.parser.parseInline(tokens);
  }
  text(token: Tokens.Text | Tokens.Escape): string {
    return "tokens" in token && token.tokens ? this.parser.parseInline(token.tokens) : token.text; // We dont wanna use escape() as it's deprecated but theres no built-in alternative that works the same way
  }
  list({ items, ordered, start }: Tokens.List): string {
    const listTag = ordered ? "discord-ordered-list" : "discord-unordered-list";
    const startAttr = ordered && start !== 1 ? ` start="${start}"` : "";
    const listItems = items.map((item) => this.listitem(item)).join("\n");
    return `<${listTag}${startAttr}>\n${listItems}\n</${listTag}>\n`;
  }
  listitem({ tokens }: Tokens.ListItem): string {
    return `<discord-list-item>${this.parser.parseInline(tokens)}</discord-list-item>`;
  }
  paragraph({ tokens }: Tokens.Paragraph): string {
    return `<p>${this.parser.parseInline(tokens)}</p>\n`;
  }
  image(_: Tokens.Image): string {
    return "";
  }
  hr(_: Tokens.Hr): string {
    return "";
  }
  html({ text }: Tokens.HTML | Tokens.Tag): string {
    return text;
  }
  table(_: Tokens.Table): string {
    return "";
  }
  tablecell(_: Tokens.TableCell): string {
    return "";
  }
  tablerow(_: Tokens.TableRow<string>): string {
    return "";
  }
  def(_: Tokens.Def): string {
    return "";
  }
  space(_: Tokens.Space): string {
    return "";
  }
}

// extensions for marked

const customRules = {
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
    return `<discord-subscript>${this.parser.parseInline(tokens.tokens!)}</discord-subscript>`;
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
    return `<discord-spoiler>${this.parser.parseInline(token.tokens!)}</discord-spoiler>`;
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
    return `<discord-custom-emoji id="${token.id}" name="${token.name}" animated="${token.animated}"></discord-custom-emoji>`;
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

type SlashcommandMentionToken = MentionToken & {
  type: "slashcommandmention";
  name: string;
};

type AnyMentionToken =
  | UserMentionToken
  | RoleMentionToken
  | ChannelMentionToken
  | ServerguideMentionToken
  | CustomizeMentionToken
  | BrowseMentionToken
  | SlashcommandMentionToken;

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
      return `<discord-mention type="user" id="${token.id}">@${token.id}</discord-mention>`;
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
      return `<discord-mention type="role" id="${token.id}">@${token.id}</discord-mention>`;
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
      return `<discord-mention type="channel" id="${token.id}">@${token.id}</discord-mention>`;
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
      return `<discord-mention type="server-guide">Server Guide</discord-mention>`;
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
      return `<discord-mention type="customize-community">Channels & Roles</discord-mention>`;
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
      return `<discord-mention type="channels-and-roles">Browse Channels</discord-mention>`;
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
      return `<discord-mention type="slash">${token.name}</discord-mention>`;
    },
  },
];

marked.use({
  // ! No, we can't pass the Renderer here, it has to be passed per-parse because if not, inline parsing of paragraphs isn't handled correctly
  // ! renderer: new SMRenderer(),
  extensions: [
    subtextExtension,
    spoilerExtension,
    customemojiExtension,
    ...(mentionExtensions as TokenizerAndRendererExtension[]), // gotta assert because TS will freak out
  ],
  breaks: true,
});

export function toDiscordHtml(message: string) {
  return marked(message, { renderer: new SMRenderer() });
}
