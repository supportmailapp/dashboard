import { redirect as svRedirect } from "@sveltejs/kit";

/**
 * Redirects the user to a different URL with a specified status code.
 *
 * **Can't be used if cookies are set in the response before redirecting!**
 *
 * @param status - The HTTP status code to use for the redirect.
 * @param url - The URL to redirect the user to.
 * @returns A Response object representing the redirect.
 *
 * @remarks
 * This function uses the `redirect` function from SvelteKit.
 * It accepts not only 3xx status codes but also every other status code.
 * For example, you can use it to redirect with a 404 status code.
 *
 * ### Status Codes (selection)
 * - `200` - OK (for successful requests)
 * - `201` - Created (for successful resource creation)
 * - `202` - Accepted (for successful request acceptance)
 * - `204` - No Content (for successful requests with no content)
 * - `301` - Moved Permanently
 * - `302` - Found (Temporary Redirect)
 * - `303` - See Other (Usually used after a POST request)
 * - `307` - Temporary Redirect
 * - `308` - Permanent Redirect
 * - `404` - Not Found (for custom error handling)
 * - `500` - Internal Server Error (for custom error handling)
 */
export function redirectResponse(status: number, url: string | URL): never {
  return svRedirect(status as any, url);
}

export function redirectToLoginWithError(errStr: string, status: number = 302): never {
  return redirectResponse(status, "/login?error=" + encodeURIComponent(errStr));
}
