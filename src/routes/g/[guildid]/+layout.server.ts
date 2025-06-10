import { redirect } from "@sveltejs/kit";

export async function load({ locals, url }) {
  if (!locals.user) {
    redirect(303, "/dash/login?next=" + url.pathname);
  }

  if (url.searchParams.has("next")) {
    redirect(303, url.searchParams.get("next")!);
  }

  return {};
}
