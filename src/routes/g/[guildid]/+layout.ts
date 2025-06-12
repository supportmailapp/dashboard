import { page } from "$app/state";
import { isCurrentPage as _isCurrentPage, guildHref as _guildHref } from "$lib";
import { GuildsManager } from "$lib/stores/GuildsManager.svelte";

export async function load({ data, params }) {
  return {
    ...data,
    guildsManager: new GuildsManager(),
    isCurrentPage: (href: string, partial: boolean = false) => _isCurrentPage(page.url, href, partial),
    guildHref: (path: string) => _guildHref(params.guildid, path),
  };
}
