import { discordUrls } from "$lib/urls";
import { redirect } from "@sveltejs/kit";

export async function GET({ params, url }) {
  return redirect(302, discordUrls.botAuth(url.origin, { guildId: params.guildid, addBot: true }));
}
