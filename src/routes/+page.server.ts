import { redirectToLoginWithError } from "$lib";

export async function load({ locals, cookies, parent }) {
  await parent();
  console.log("Loading +page.server.ts");
  const data = await locals.getSafeSession();
  if (data.error) {
    if (data.error === "expired") {
      cookies.delete("session", { path: "/" });
      redirectToLoginWithError("Session expired. Please log in again.", 401);
    }
    redirectToLoginWithError("An error occurred. Please try again later.", 500);
  }

  return {
    user: data.user,
    error: data.error,
  };
}
