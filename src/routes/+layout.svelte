<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { guilds } from "$lib/stores/guilds.svelte";
  import { page } from "$app/state";
  import { loadGuilds } from "$lib/utils/clientStuff";

  let { children } = $props();

  $effect(() => console.log("Guilds update", $state.snapshot($guilds)));

  onMount(async function () {
    if (page.data.user && !$guilds) {
      guilds.set((await loadGuilds()) || []);
    }
  });
</script>

<!-- Layout for server selection or login -->
{@render children()}
