<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { getManager } from "$lib/stores/GuildsManager.svelte";
  import { useSidebar } from "$ui/sidebar";
  import { onMount } from "svelte";

  let sidebar = $derived(useSidebar());
  const guildsManager = getManager();

  $inspect("sidebar", sidebar);

  onMount(() => {
    guildsManager.loadChannels().then(() => {
      console.log("Channels loaded");
    });

    guildsManager.loadRoles().then(() => {
      console.log("Roles loaded");
    });
  });

  // TODO: Find out why sidebar is always undefined...
  afterNavigate(() => {
    sidebar?.setOpenMobile(false);
  });
</script>
