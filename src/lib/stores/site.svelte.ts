import { page } from "$app/state";

export const site = $state<any>({});

export function guildHref(nextPath?: string) {
  return `/-/${page.params.guildid!}${nextPath ?? ""}`;
}

/**
 * Checks if the current page matches the given href.
 * @param url The current URL.
 * @param check The href to check against the current page.
 * @param partial If true, checks if the current page starts with the given href. Defaults to true.
 * @returns True if the current page matches the href, false otherwise.
 */
export function isCurrentPage(check: string, partial = true) {
  const currentUrl = new URL($state.snapshot(page.url));
  if (partial) {
    return currentUrl.pathname.startsWith(check);
  }
  return currentUrl.pathname === check;
}
