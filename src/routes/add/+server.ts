import { urls } from "$lib/constants.js";
import { redirect } from "@sveltejs/kit";

export async function GET() {
  return redirect(302, urls.discord.botAdd());
}
