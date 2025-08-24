<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import { useSidebar } from "$ui/sidebar";
  import { onMount } from "svelte";

  let sidebar = $derived(useSidebar());

  $inspect("sidebar", sidebar);

  onMount(() => {
    page.data.guildsManager.loadChannels().then(() => {
      console.log("Channels loaded");
    });

    page.data.guildsManager.loadRoles().then(() => {
      console.log("Roles loaded");
    });
  });

  // TODO: Find out why sidebar is always undefined...
  afterNavigate(() => {
    sidebar.setOpenMobile(false);
  });
</script>
