import twemoji from "twemoji";

export function parseUnicodeEmoji(emoji: string): string {
  const codepoints = twemoji.convert
    .toCodePoint(
      emoji.indexOf(String.fromCharCode(0x200d)) < 0 ? emoji.replace(/\uFE0F/g, "") : emoji,
    )
    .toLowerCase();

  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${codepoints}.svg`;
}
