import { redirectResponse } from "$lib";

export async function load({ locals, url }) {
  if (!locals.user) {
    redirectResponse(404, "/dash/login?next=" + url.pathname);
  }

  if (url.searchParams.has("next")) {
    redirectResponse(303, url.searchParams.get("next")!);
  }

  return {};
}
