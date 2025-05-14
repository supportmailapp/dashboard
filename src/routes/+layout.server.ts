import { APIRoutes } from "$lib/urls.js";
import { redirect } from "@sveltejs/kit";

export const load = async ({ locals, url }) => {
  // Redirect to refresh token endpoint if the user is not logged in
  // and the refresh token is present
  if (locals.refreshToken) {
    redirect(302, APIRoutes.refresh(url.pathname));
  }

  return {
    ccDate: "2025",
    user: locals.user,
  };
};
