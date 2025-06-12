import { discordUrls } from "$lib/urls";
import { redirect } from "@sveltejs/kit";

export async function GET() {
  return redirect(302, discordUrls.botAuth({ addBot: true }));
}
