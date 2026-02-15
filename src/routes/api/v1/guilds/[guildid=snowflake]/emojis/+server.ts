import { JsonErrors } from "$lib/constants.js";
import guildEmojis from "$lib/server/caches/guildEmojis.js";
import { json } from "@sveltejs/kit";

export async function GET({ params, locals }) {
  const cached = guildEmojis.get<Array<APICustomEmoji>>(params.guildid);
  if (cached) {
    return json(cached);
  }

  const emojis = await locals.discordRest.listGuildEmojis(params.guildid);
  if (emojis.isSuccess()) {
    guildEmojis.set(params.guildid, emojis.data);
    return json(emojis.data);
  }
  return JsonErrors.serverError(emojis.errorToString());
}
