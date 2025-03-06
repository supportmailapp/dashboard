<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";

  import DesktopNavigation from "$lib/components/DesktopNavigation.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import MobileNavigation from "$lib/components/MobileNavigation.svelte";
  import ServerSelectDialog from "$lib/components/ServerSelectDialog.svelte";
  import { APIRoutes, mediaQuery } from "$lib/constants.js";
  import { gg, loadGuildConfig, loadGuildData } from "$lib/stores/guild.svelte";
  import { site } from "$lib/stores/site.svelte.js";

  let { children, data } = $props();

  let innerWidth = $state(800);

  onMount(async function () {
    if (!gg.guild || page.params.guildid !== gg.guild.id) {
      await loadGuildData(page.params.guildid);
      await loadGuildConfig(page.params.guildid);
    }

    if (!site.news) {
      const res = await fetch(APIRoutes.news(), {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        site.news = (await res.json()) as any[];
      }
    }
  });
</script>

<svelte:window bind:innerWidth />

<div class="flex min-h-screen w-full max-w-screen flex-row overflow-x-hidden">
  {#if innerWidth >= mediaQuery.md}
    <DesktopNavigation />
  {/if}

  <div class="w-full">
    <div class="flex min-h-screen w-full flex-col p-3" transition:slide={{ duration: 250, axis: "x" }}>
      {#if !gg.config}
        <div class="flex h-max w-full items-center justify-center">
          <span class="dy-loading dy-loading-infinity dy-loading-xl select-none"></span>
        </div>
      {:else}
        {@render children()}
      {/if}
    </div>
    <Footer year={data.ccDate} />
  </div>
</div>

{#if innerWidth < mediaQuery.md}
  <MobileNavigation />
{/if}

{#if gg.unsavedChanges}
  <!-- <SaveModal  /> -->
{/if}

<ServerSelectDialog />
