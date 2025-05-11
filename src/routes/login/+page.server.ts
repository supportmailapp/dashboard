import { createOAuth2Login } from "$lib/discord/oauth2";
import { redirect } from "@sveltejs/kit";

export async function load({ locals }) {
  if (locals.user) {
    redirect(303, "/");
  }

  return {};
}

export const actions = {
  default: async ({ url, cookies, request }) => {
    const data = await request.formData();
    console.debug("Login form data", data.entries());
    const res = createOAuth2Login({
      url: new URL(url),
      prompt: data.get("remember") === "true" ? "true" : "none",
      joinDiscord: data.get("join-discord") === "true",
    });
    cookies.set("discord-oauth2-state", res.state, { path: "/" });
    return {
      url: res.url,
      state: res.state,
    };
  },
};
