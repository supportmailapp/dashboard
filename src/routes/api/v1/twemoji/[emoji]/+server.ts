// Since twemoji stuff is hard, proxy the unicode in <discord-unicode-emoji> through an API route which serves the proper img tag

import { parseUnicodeEmoji } from "$lib/server/twemoji";

export async function GET({ params }) {
  const emoji = decodeURIComponent(params.emoji);

  const unicodeEmojiUrl = parseUnicodeEmoji(emoji);

  // Redirect to the twemoji CDN URL
  return Response.redirect(unicodeEmojiUrl, 303);
}
