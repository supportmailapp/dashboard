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
    let retries = 0;
    while (retries < 3) {
      if (!gg.guild || page.params.guildid !== gg.guild.id) {
        try {
          await loadGuildData(page.params.guildid);
          await loadGuildConfig(page.params.guildid);
          if (gg.guild && gg.config) break;
        } catch (error) {
          retries++;
          if (retries < 3) {
            console.log("Failed to load guild data and config, retrying in 11 seconds", error);
            await new Promise((resolve) => setTimeout(resolve, 11000));
          } else {
            console.error("Failed to load guild data and config after 3 attempts", error);
          }
        }
      } else {
        break; // Exit loop if condition is not met
      }
    }
  });
</script>

<svelte:window bind:innerWidth />

<div class="flex min-h-screen w-full max-w-screen flex-row">
  {#if innerWidth >= mediaQuery.md}
    <DesktopNavigation />
  {/if}

  <div class="h-full w-full">
    <div
      class="flex min-h-screen w-full max-w-[1000px] flex-col gap-5 p-4 md:p-9"
      transition:slide={{ duration: 250, axis: "x" }}
    >
      {#if !gg.config && site.loading}
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
