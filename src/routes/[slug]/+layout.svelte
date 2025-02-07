<script lang="ts">
  import { page } from "$app/state";
  import { gg, loadGuildData, resetGuild } from "$lib/stores/guild.svelte";
  import { onMount } from "svelte";

  let { children } = $props();

  onMount(async function () {
    if (page.params.slug !== gg.guild?.id) {
      resetGuild();
      await loadGuildData(page.params.slug);
    }
  });
</script>

{@render children()}
