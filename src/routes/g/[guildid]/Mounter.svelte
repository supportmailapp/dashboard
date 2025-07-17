<script lang="ts">
  import { page } from "$app/state";

  $effect(() => {
    page.data.guildsManager.loadChannels().then(() => {
      console.log("Channels loaded");
    });

    page.data.guildsManager.loadRoles().then(() => {
      console.log("Roles loaded");
    });
  });
</script>
