import { redirect } from "@sveltejs/kit";

export async function load({ params, parent, cookies }) {
  const { user } = await parent();
  const channelId = params.channelid;

  if (!user) {
    // Not logged in: set cookie and redirect to login
    cookies.set("post_login_redirect", JSON.stringify({ dm: channelId }), {
      path: "/",
      sameSite: "lax",
    });
    redirect(303, "/login");
  }

  // Already logged in: redirect directly to Discord DM
  return {};
}
