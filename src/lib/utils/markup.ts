/** MarkdownParser.ts
 *
 * Tokenization-first markdown -> HTML implementation
 *
 * Features:
 * - Bold: **bold**
 * - Italic: *italic* or _italic_
 * - Underline: __underline__
 * - Subtext: lines starting with "-# "
 * - Strikethrough: ~~strike~~
 * - Headings: #, ##, ###
 * - Codeblocks: ```...``` (now supports single-line ```code``` too)
 * - Inline code: `...`
 * - Lists & nested lists (ordered and unordered)
 * - Hyperlinks: [text](url)
 * - Blockquotes: lines starting with "> " (single-line) and ">>> " (rest-of-message)
 *
 * Notes:
 * - Anything inside codeblocks or inline-code is not parsed further.
 * - Lines starting with two spaces after a list item are appended to the previous <li>.
 * - Every input line is treated as a new line (blocks emitted per input line).
 */

export class MarkupParser {
  parse(input: string): string {
    const lines = input.replace(/\r\n/g, "\n").split("\n");
    const lineTokens = this.tokenizeLines(lines);
    const html = this.parseLineTokens(lineTokens);
    return html;
  }

  // ---------- LINE TOKENIZER ----------
  private tokenizeLines(lines: string[]): LineToken[] {
    const tokens: LineToken[] = [];
    let i = 0;

    while (i < lines.length) {
      const raw = lines[i];

      // Code block detection: lines starting with ```
      // Supports single-line fenced block: ```code``` and multi-line fenced block
      if (raw.trim().startsWith("```")) {
        const openingPos = raw.indexOf("```");
        const closingPos = raw.indexOf("```", openingPos + 3);
        if (closingPos !== -1 && closingPos !== openingPos) {
          // same-line fenced block
          const content = raw.slice(openingPos + 3, closingPos);
          tokens.push({ type: "@@CODE_BLOCK@@", content });
          i++;
          continue;
        }

        // multiline fenced block: skip the opening line (may contain language)
        i++;
        const codeBlockBuffer: string[] = [];
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeBlockBuffer.push(lines[i]);
          i++;
        }
        // consume closing ``` if present
        if (i < lines.length && lines[i].trim().startsWith("```")) {
          i++;
        }
        tokens.push({ type: "@@CODE_BLOCK@@", content: codeBlockBuffer.join("\n") });
        continue;
      }

      // Blank line
      if (raw.trim() === "") {
        tokens.push({ type: "@@BLANK@@" });
        i++;
        continue;
      }

      // Blockquote: ">>> " -> rest of message as one blockquote
      if (raw.startsWith(">>> ")) {
        const buffer: string[] = [];
        buffer.push(raw.slice(4));
        i++;
        while (i < lines.length) {
          buffer.push(lines[i]);
          i++;
        }
        tokens.push({ type: "@@BLOCKQUOTE@@", content: buffer.join("\n") });
        continue;
      }

      // Blockquote: "> " at start of a single line
      if (raw.startsWith("> ")) {
        const content = raw.slice(2);
        tokens.push({ type: "@@BLOCKQUOTE@@", content });
        i++;
        continue;
      }

      // Subtext - lines starting with "-# "
      if (raw.startsWith("-# ")) {
        const content = raw.slice(3);
        tokens.push({ type: "@@SUBTEXT@@", content });
        i++;
        continue;
      }

      // Headings 1-3
      const headingMatch = raw.match(/^(#{1,3})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length as 1 | 2 | 3;
        const content = headingMatch[2];
        tokens.push({ type: "@@HEADING@@", level, content });
        i++;
        continue;
      }

      // List item detection (ordered or unordered). Count leading spaces as indent.
      const leadingSpaces = raw.match(/^ */)![0].length;
      const trimmed = raw.trim();

      const unorderedMatch = trimmed.match(/^([-*+])\s+(.*)$/);
      const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);

      if (unorderedMatch) {
        const content = unorderedMatch[2];
        tokens.push({ type: "@@LIST_ITEM@@", ordered: false, indent: leadingSpaces, content });
        i++;
        continue;
      } else if (orderedMatch) {
        const content = orderedMatch[2];
        tokens.push({ type: "@@LIST_ITEM@@", ordered: true, indent: leadingSpaces, content });
        i++;
        continue;
      }

      // Continuation lines: lines that have leading spaces and are not list items
      // This should come AFTER list item detection to avoid interfering with nested lists
      if (leadingSpaces >= 2) {
        const content = raw.slice(leadingSpaces);
        tokens.push({ type: "@@CONTINUATION@@", indent: leadingSpaces, content });
        i++;
        continue;
      }

      // Default paragraph
      tokens.push({ type: "@@PARAGRAPH@@", content: raw });
      i++;
    }

    return tokens;
  }

  // ---------- LINE-TOKEN PARSER (build HTML) ----------
  private parseLineTokens(tokens: LineToken[]): string {
    const out: string[] = [];
    // list stack holds {type, indent}
    const listStack: Array<{ type: "ul" | "ol"; indent: number }> = [];

    // helper: close lists until we reach the target indent level
    const closeListsToIndent = (targetIndent: number) => {
      while (listStack.length && listStack[listStack.length - 1].indent > targetIndent) {
        const top = listStack.pop()!;
        out.push(`</${top.type}>`);
      }
    };

    // helper: ensure we have the right list structure for the given indent and type
    const ensureListAtIndent = (ordered: boolean, indent: number) => {
      const neededType = ordered ? "ol" : "ul";

      // Close lists that are at deeper levels than needed
      closeListsToIndent(indent - 1);

      // Check if we already have the right list at this level
      const top = listStack[listStack.length - 1];
      if (top && top.indent === indent && top.type === neededType) {
        return; // Already have the right list
      }

      // If we have a different type at same level, close it first
      if (top && top.indent === indent && top.type !== neededType) {
        listStack.pop();
        out.push(`</${top.type}>`);
      }

      // Open new list
      listStack.push({ type: neededType, indent });
      out.push(`<${neededType}>`);
    };

    // Track list items for continuation handling
    let lastListItemIndex = -1;

    for (let idx = 0; idx < tokens.length; idx++) {
      const tk = tokens[idx];

      if (tk.type === "@@CODE_BLOCK@@") {
        // Close all lists
        while (listStack.length) {
          const top = listStack.pop()!;
          out.push(`</${top.type}>`);
        }
        out.push(`<pre><code>${this.escapeHtml(tk.content)}</code></pre>`);
        lastListItemIndex = -1;
        continue;
      }

      if (tk.type === "@@BLANK@@") {
        // Close all lists
        while (listStack.length) {
          const top = listStack.pop()!;
          out.push(`</${top.type}>`);
        }
        out.push(`<p></p>`);
        lastListItemIndex = -1;
        continue;
      }

      if (tk.type === "@@HEADING@@") {
        // Close all lists
        while (listStack.length) {
          const top = listStack.pop()!;
          out.push(`</${top.type}>`);
        }
        const inner = this.parseInline(tk.content);
        if (tk.level === 1) out.push(`<h1>${inner}</h1>`);
        else if (tk.level === 2) out.push(`<h2>${inner}</h2>`);
        else out.push(`<h3>${inner}</h3>`);
        lastListItemIndex = -1;
        continue;
      }

      if (tk.type === "@@SUBTEXT@@") {
        // Close all lists
        while (listStack.length) {
          const top = listStack.pop()!;
          out.push(`</${top.type}>`);
        }
        const inner = this.parseInline(tk.content);
        out.push(`<small class="subtext">${inner}</small>`);
        lastListItemIndex = -1;
        continue;
      }

      if (tk.type === "@@BLOCKQUOTE@@") {
        // Close all lists
        while (listStack.length) {
          const top = listStack.pop()!;
          out.push(`</${top.type}>`);
        }
        const lines = tk.content.split("\n");
        const innerLines = lines.map((ln) => {
          if (ln.trim() === "") return `<p></p>`;
          return `<p>${this.parseInline(ln)}</p>`;
        });
        out.push(`<blockquote>\n${innerLines.join("\n")}\n</blockquote>`);
        lastListItemIndex = -1;
        continue;
      }

      if (tk.type === "@@LIST_ITEM@@") {
        // Ensure we have the right list structure
        ensureListAtIndent(tk.ordered, tk.indent);

        const contentHtml = this.parseInline(tk.content);
        out.push(`<li>${contentHtml}</li>`);
        lastListItemIndex = out.length - 1;
        continue;
      }

      if (tk.type === "@@CONTINUATION@@") {
        // Only append to last list item if we're in a list context
        if (listStack.length > 0 && lastListItemIndex >= 0) {
          const liHtml = out[lastListItemIndex];
          if (liHtml.endsWith("</li>")) {
            // Remove </li>, add content with <br/>, then close </li>
            const withoutClose = liHtml.slice(0, -5);
            const appended = `${withoutClose}<br/>${this.parseInline(tk.content)}</li>`;
            out[lastListItemIndex] = appended;
          }
        } else {
          // Not in list context, treat as paragraph
          out.push(`<p>${this.parseInline(tk.content)}</p>`);
        }
        continue;
      }

      if (tk.type === "@@PARAGRAPH@@") {
        // Close all lists
        while (listStack.length) {
          const top = listStack.pop()!;
          out.push(`</${top.type}>`);
        }
        const inner = this.parseInline(tk.content);
        out.push(`<p>${inner}</p>`);
        lastListItemIndex = -1;
        continue;
      }
    }

    // Close remaining open lists
    while (listStack.length) {
      const top = listStack.pop()!;
      out.push(`</${top.type}>`);
    }

    return out.join("\n");
  }

  // ---------- INLINE PARSER ----------
  private parseInline(text: string): string {
    let i = 0;
    const n = text.length;
    const out: string[] = [];
    const tagStack: string[] = [];

    const openTag = (tag: string) => {
      tagStack.push(tag);
      out.push(`<${tag}>`);
    };
    const closeTag = (expectedTag?: string) => {
      if (tagStack.length === 0) return false;
      const top = tagStack[tagStack.length - 1];
      if (!expectedTag || top === expectedTag) {
        tagStack.pop();
        out.push(`</${top}>`);
        return true;
      }
      return false;
    };

    const flushText = (s: string) => out.push(this.escapeHtml(s));

    while (i < n) {
      const ch = text[i];

      if (ch === "`") {
        const end = text.indexOf("`", i + 1);
        if (end !== -1) {
          const code = text.slice(i + 1, end);
          out.push(`<code>${this.escapeHtml(code)}</code>`);
          i = end + 1;
          continue;
        } else {
          flushText("`");
          i++;
          continue;
        }
      }

      if (ch === "[") {
        const closeBracket = this.findClosingBracket(text, i, "[", "]");
        if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
          const closeParen = this.findClosingBracket(text, closeBracket + 1, "(", ")");
          if (closeParen !== -1) {
            const linkText = text.slice(i + 1, closeBracket);
            const url = text.slice(closeBracket + 2, closeParen);
            const parsedText = this.parseInline(linkText);
            out.push(`<a href="${this.escapeHtmlAttr(url)}" target="_blank">${parsedText}</a>`);
            i = closeParen + 1;
            continue;
          }
        }
        flushText("[");
        i++;
        continue;
      }

      const two = text.slice(i, i + 2);
      if (two === "**") {
        if (tagStack[tagStack.length - 1] === "strong") closeTag("strong");
        else openTag("strong");
        i += 2;
        continue;
      }
      if (two === "__") {
        if (tagStack[tagStack.length - 1] === "u") closeTag("u");
        else openTag("u");
        i += 2;
        continue;
      }
      if (two === "~~") {
        if (tagStack[tagStack.length - 1] === "del") closeTag("del");
        else openTag("del");
        i += 2;
        continue;
      }

      if (ch === "*" || ch === "_") {
        if (tagStack[tagStack.length - 1] === "em") closeTag("em");
        else openTag("em");
        i++;
        continue;
      }

      let j = i;
      while (j < n && !"`[*_~[".includes(text[j])) j++;
      const segment = text.slice(i, j);
      flushText(segment);
      i = j;
    }

    while (tagStack.length) {
      const t = tagStack.pop()!;
      out.push(`</${t}>`);
    }

    return out.join("");
  }

  private findClosingBracket(s: string, startIndex: number, open: string, close: string): number {
    if (s[startIndex] !== open) return -1;
    for (let i = startIndex + 1; i < s.length; i++) {
      if (s[i] === close) return i;
    }
    return -1;
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  private escapeHtmlAttr(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

type LineToken =
  | { type: "@@CODE_BLOCK@@"; content: string }
  | { type: "@@HEADING@@"; level: 1 | 2 | 3; content: string }
  | { type: "@@SUBTEXT@@"; content: string }
  | { type: "@@LIST_ITEM@@"; ordered: boolean; indent: number; content: string }
  | { type: "@@CONTINUATION@@"; indent: number; content: string }
  | { type: "@@PARAGRAPH@@"; content: string }
  | { type: "@@BLANK@@" }
  | { type: "@@BLOCKQUOTE@@"; content: string };
