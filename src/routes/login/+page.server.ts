import { env } from "$env/dynamic/private";
import { createOAuth2Login } from "$lib/discord/oauth2";
import { redirect } from "@sveltejs/kit";

export async function load({ locals }) {
  if (locals.user) {
    redirect(303, "/");
  }

  const response = await fetch(
    `https://api.unsplash.com/photos/random?topics=nature,wallpaper&content_filter=high&client_id=${env.UNSPLASH_ACCESS_KEY}`,
    {
      method: "GET",
    },
  );

  return {
    unsplash: response.json(),
  };
}

export const actions = {
  default: async ({ url, cookies }) => {
    const res = createOAuth2Login(url);
    cookies.set("discord-oauth2-state", res.state, { path: "/" });
    return redirect(303, res.url);
  },
};
