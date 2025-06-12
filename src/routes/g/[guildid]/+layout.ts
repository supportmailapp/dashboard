import { page } from "$app/state";
import { isCurrentPage as _isCurrentPage, guildHref as _guildHref } from "$lib";

export async function load({ params, parent }) {
  await parent();
  return {
    isCurrentPage: (href: string, partial: boolean = false) => _isCurrentPage(page.url, href, partial),
    guildHref: (path: string) => _guildHref(params.guildid, path),
  };
}
