<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { getManager } from "$lib/stores/GuildsManager.svelte";
  import { useSidebar } from "$ui/sidebar";
  import { untrack } from "svelte";

  const sidebar = useSidebar();
  const guildsManager = getManager();

  // TODO: Find out why sidebar is always undefined...
  afterNavigate((nav) => {
    const guildIdChanged = nav.from?.params?.guildid !== nav.to?.params?.guildid;
    if (guildIdChanged) {
      console.log("Guild ID changed, reloading channels and roles...");
      untrack(() => guildsManager.loadChannels().then(() => console.log("Channels loaded")));
      untrack(() => guildsManager.loadRoles().then(() => console.log("Roles loaded")));
    }

    if (nav.from?.route !== nav.to?.route) {
      sidebar?.setOpenMobile(false);
      if (!sidebar) {
        console.warn("Sidebar is undefined in Mounter (afterNavigate)");
      }
    }
  });
</script>
