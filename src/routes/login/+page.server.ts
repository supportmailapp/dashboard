import { createOAuth2Login } from "$lib/discord/oauth2";
import { redirect } from "@sveltejs/kit";

export async function load({ locals }) {
  if (locals.user) {
    redirect(303, "/");
  }

  return {};
}

export const actions = {
  default: async ({ url, cookies }) => {
    const res = createOAuth2Login(url);
    cookies.set("discord-oauth2-state", res.state, { path: "/" });
    return redirect(303, res.url);
  },
};
