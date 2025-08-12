import { redirectToLoginWithError } from "$lib";

export async function load({ locals, cookies, parent }) {
  await parent();
  const data = await locals.getSafeSession();
  if (data.error) {
    if (data.error === "expired") {
      cookies.delete("session", { path: "/" });
      redirectToLoginWithError("Session expired. Please log in again.");
    }
    redirectToLoginWithError("An error occurred. Please try again later.");
  }

  return {
    user: data.user,
    error: data.error,
  };
}
