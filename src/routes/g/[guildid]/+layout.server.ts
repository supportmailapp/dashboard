import { redirectResponse } from "$lib";
import { isCurrentPage as _isCurrentPage, guildHref as _guildHref } from "$lib";

export async function load({ locals, url }) {
  if (!locals.isAuthenticated()) {
    redirectResponse(303, "/dash/login?next=" + url.pathname);
  }

  if (url.searchParams.has("next")) {
    redirectResponse(303, url.searchParams.get("next")!);
  }

  return {};
}
