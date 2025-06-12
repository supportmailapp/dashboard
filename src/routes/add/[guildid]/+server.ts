import { discordUrls } from "$lib/urls";
import { redirect } from "@sveltejs/kit";

export async function GET({ params }) {
  return redirect(302, discordUrls.botAuth({ guildId: params.guildid, addBot: true }));
}
