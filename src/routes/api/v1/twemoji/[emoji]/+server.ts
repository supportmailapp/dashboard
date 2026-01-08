// Since twemoji stuff is hard, we proxy the unicode in <discord-unicode-emoji> through this API route to get the SVG from the twemoji CDN

import { parseUnicodeEmoji } from "$lib/server/twemoji";

export async function GET({ params }) {
  const emoji = decodeURIComponent(params.emoji);

  const unicodeEmojiUrl = parseUnicodeEmoji(emoji);

  // Redirect to the twemoji CDN URL because this takes the load off our server
  return Response.redirect(unicodeEmojiUrl, 303);
}
