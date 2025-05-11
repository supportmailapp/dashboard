import { DiscordREST } from "$lib/discord/utils.js";

const rest = new DiscordREST();

export async function GET({ locals: { guildId } }) {
  const emojis = await rest.getGuildEmojis(guildId, false);
  return Response.json(emojis);
}
