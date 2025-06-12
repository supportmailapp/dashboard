import { redirectResponse } from "$lib";
import { discordUrls } from "$lib/urls";

export async function load({ parent }) {
  const { user } = await parent();
  if (user) {
    return redirectResponse(302, "/");
  }
}

export const actions = {
  default: async function ({ cookies, request }) {
    const formData = await request.formData();
    const stayLoggedIn = formData.get("stayLoggedIn") === "on"; // Currently unused
    const state = crypto.randomUUID();
    cookies.set("state", state, { path: "/" });
    cookies.set("keep-refresh-token", String(stayLoggedIn), { path: "/" });
    console.log("State set in cookie:", state);
    return {
      success: true,
      url: discordUrls.botAuth({ state }),
    };
  },
};
