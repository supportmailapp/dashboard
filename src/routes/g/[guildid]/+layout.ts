import { isCurrentPage as _isCurrentPage, guildHref as _guildHref } from "$lib";
import { GuildsManager } from "$lib/stores/GuildsManager.svelte";

export async function load({ url, params, depends }) {
  depends("guilds:page");
  return {
    guildsManager: new GuildsManager(),
    isCurrentPage: (href: string, partial: boolean = false) => _isCurrentPage(url, href, partial),
    guildHref: (path: string) => _guildHref(params.guildid, path),
  };
}
