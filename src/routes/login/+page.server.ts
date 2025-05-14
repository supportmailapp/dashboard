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
    console.debug("Login form data", data.get("remember"), data.get("join-discord"));
    const res = createOAuth2Login({
      url: new URL(url),
      joinDiscord: data.get("join-discord") === "on",
      prompt: cookies.get("stay-logged-in") === "true" ? "none" : "true",
    });

    cookies.set("discord-oauth2-state", res.state, { path: "/" });
    if (data.get("remember") === "on") {
      cookies.set("stay-logged-in", "true", { path: "/" });
    }

    return {
      url: res.url,
      state: res.state,
    };
  },
};
