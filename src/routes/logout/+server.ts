import { redirectResponse } from "$lib";
import { SessionManager } from "$lib/server/auth";

export async function GET({ cookies, locals }) {
  /*
    1. User GETs the logout route.
    2. The application gets and deletes the tokens from the database (if found).
    3. The application revokes the access token (if found) and the refresh token (if found).
    4. The application deletes the session cookie (JWT).
    5. The user is redirected to the login page.
  */

  if (cookies.get("session")) {
    cookies.delete("session", { path: "/" });
  }

  if (!locals.user) {
    return redirectResponse(303, "/login");
  }

  const tokens = await SessionManager.getAndDeleteToken(locals.user.id);
  if (tokens?.accessToken) await SessionManager.revokeToken(tokens.accessToken, "access");
  if (tokens?.refreshToken) await SessionManager.revokeToken(tokens.refreshToken, "refresh");
  return redirectResponse(303, "/login");
}
