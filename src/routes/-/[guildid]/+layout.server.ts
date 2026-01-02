import { isCurrentPage as _isCurrentPage, guildHref as _guildHref } from "$lib";
import { redirect } from "@sveltejs/kit";

export async function load({ locals, url }) {
  if (!locals.isAuthenticated()) {
    redirect(303, "/login?next=" + url.pathname);
  }

  if (url.searchParams.has("next")) {
    redirect(303, url.searchParams.get("next")!);
  }

  return {};
}
