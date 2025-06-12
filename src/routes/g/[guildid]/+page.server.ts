import { redirect } from "@sveltejs/kit";

export async function load({ url, params: { guildid } }) {
  const redirectUrl = new URL(`/g/${guildid}/home`, url.origin);
  if (url.searchParams.has("next")) {
    redirectUrl.searchParams.set("next", url.searchParams.get("next")!);
  }

  redirect(301, redirectUrl);
}
