import { redirect } from "@sveltejs/kit";

type RedirectStatus = 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308;

export function redirectToLoginWithError({
  status = 302,
  errKey,
  description,
}: {
  errKey?: string;
  description?: string;
  status?: RedirectStatus;
}): never {
  return redirect(
    status,
    "/login?error=" +
      (errKey || "unknown") +
      (description ? `&error_description=${encodeURIComponent(description)}` : ""),
  );
}

/**
 * Checks if the current page matches the given href.
 * @param url The current URL.
 * @param check The href to check against the current page.
 * @param partial If true, checks if the current page starts with the given href. Defaults to true.
 * @returns True if the current page matches the href, false otherwise.
 */
export function isCurrentPage(url: URL, check: string, partial = true) {
  if (partial) {
    return url.pathname.startsWith(check);
  }
  return url.pathname === check;
}

/**
 * Generates a URL path for a guild with an optional next path segment.
 *
 * @param guildId - The unique identifier of the guild
 * @param nextPath - Optional additional path to append after the guild ID
 * @returns The constructed URL path in the format `/g/{guildId}{nextPath}`
 *
 * @example
 * ```typescript
 * guildHref("123456789") // Returns "/g/123456789"
 * guildHref("123456789", "/settings") // Returns "/g/123456789/settings"
 * ```
 */
export function guildHref(guildId: string, nextPath?: string) {
  return `/g/${guildId}${nextPath ? nextPath : ""}`;
}

export function getNextPathFromGuildPath(pathname: string) {
  const match = pathname.replace(/^\/g\/\d+/, "").match(/^(\/[^/]+)?/);
  if (match) {
    return match[1] || "/";
  }
  return "/";
}
