<script lang="ts">
  import { page } from "$app/state";
  import { APIRoutes } from "$lib/constants";
  import { configState, loadConfig } from "$lib/stores/config.svelte";
  import { onMount } from "svelte";

  let { children } = $props();

  onMount(async function () {
    configState.config = null;
    await loadConfig(APIRoutes.configTicketsBase(page.params.guildid));
  });
</script>

{#if !configState.config}
  <div class="flex h-max w-full items-center justify-center">
    <span class="dy-loading dy-loading-infinity dy-loading-xl select-none"></span>
  </div>
{:else}
  {@render children()}
{/if}
