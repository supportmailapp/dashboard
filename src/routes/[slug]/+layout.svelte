<script lang="ts">
  import { page } from "$app/state";
  import DesktopNavigation from "$lib/components/DesktopNavigation.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import MobileNavigation from "$lib/components/MobileNavigation.svelte";
  import { mediaQuery } from "$lib/constants.js";
  import { gg, loadGuildData, resetGuild } from "$lib/stores/guild.svelte";
  import { onMount } from "svelte";

  let { children, data } = $props();

  let innerWidth = $state(800);

  onMount(async function () {
    if (page.params.slug !== gg.guild?.id) {
      resetGuild();
      await loadGuildData(page.params.slug);
    }
  });
</script>

<svelte:window bind:innerWidth />

<div class="flex min-h-screen w-full flex-row">
  {#if innerWidth >= mediaQuery.md}
    <DesktopNavigation />
  {/if}

  <div class="flex w-full flex-1 flex-col p-3 text-wrap">
    {@render children()}

    <Footer year={data.ccDate} />
  </div>
</div>

{#if innerWidth < mediaQuery.md}
  <MobileNavigation />
{/if}
