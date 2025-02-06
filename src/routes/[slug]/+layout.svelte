<script lang="ts">
  import { guilds } from "$lib/stores/guilds.svelte";
  import { guild, channels, roles, resetGuild } from "$lib/stores/guild.svelte";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { loadGuildData } from "$lib/utils/clientStuff";

  let { children } = $props();

  onMount(async function () {
    if (!$guild || page.params.slug !== $guild.id) {
      resetGuild();
      await loadGuildData(page.params.slug);
    }
  });
</script>

{@render children()}
