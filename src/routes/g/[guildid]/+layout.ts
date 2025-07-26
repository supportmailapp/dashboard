import { page } from "$app/state";
import { isCurrentPage as _isCurrentPage, guildHref as _guildHref } from "$lib";
import type { GuildsManager } from "$lib/stores/GuildsManager.svelte.js";

export async function load({ params, parent }) {
  const data = await parent();
  console.log("Parent Data", data);
  // await (data.guildsManager as GuildsManager).loadChannels();
  // await (data.guildsManager as GuildsManager).loadRoles();
  return {
    guildId: params.guildid,
    isCurrentPage: (href: string, partial: boolean = false) => _isCurrentPage(page.url, href, partial),
    guildHref: (path: string) => _guildHref(params.guildid, path),
  };
}
