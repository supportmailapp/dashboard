<script lang="ts">
  import { page } from "$app/state";
  import { currentGuild, loadGuildData, resetGuild } from "$lib/stores/guild.svelte";
  import { onMount } from "svelte";

  let { children } = $props();

  onMount(async function () {
    if (!currentGuild || page.params.slug !== currentGuild.g?.id) {
      resetGuild();
      await loadGuildData(page.params.slug);
    }
  });
</script>

{@render children()}
