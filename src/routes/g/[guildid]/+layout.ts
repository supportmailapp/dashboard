import { page } from "$app/state";
import { isCurrentPage as _isCurrentPage, guildHref as _guildHref } from "$lib";
import { DataManager } from "$lib/stores/DataManager.svelte.js";

export async function load({ params, parent }) {
  await parent();
  return {
    manager: new DataManager(),
    guildId: params.guildid,
    isCurrentPage: (href: string, partial: boolean = false) => _isCurrentPage(page.url, href, partial),
    guildHref: (path: string) => _guildHref(params.guildid, path),
  };
}
