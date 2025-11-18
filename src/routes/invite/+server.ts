import { discordUrls } from "$lib/urls";
import { redirect } from "@sveltejs/kit";

export async function GET({ url }) {
  return redirect(302, discordUrls.botAuth(url.origin, { addBot: true }));
}
