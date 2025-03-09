<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";

  import DesktopNavigation from "$lib/components/DesktopNavigation.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import MobileNavigation from "$lib/components/MobileNavigation.svelte";
  import RefreshButton from "$lib/components/RefreshButton.svelte";
  import SaveAlert from "$lib/components/SaveAlert.svelte";
  import ServerSelectDialog from "$lib/components/ServerSelectDialog.svelte";
  import { mediaQuery } from "$lib/constants.js";
  import { gg, loadGuildConfig, loadGuildData } from "$lib/stores/guild.svelte";
  import { site } from "$lib/stores/site.svelte.js";
  import { user } from "$lib/stores/user.svelte.js";

  let { children, data } = $props();

  let width = $state(800);

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

<svelte:window bind:innerWidth={width} />

<div class="page-container">
  {#if width >= mediaQuery.md}
    <DesktopNavigation />
    <div class="gradient-divider from-base-100 bg-gradient-to-l to-black/5"></div>
  {/if}
  <div class="main-container" transition:slide={{ duration: 250, axis: "x" }}>
    {#if !gg.config || !gg.guild || !user.discord || site.loading}
      <div class="flex h-max w-full items-center justify-center">
        <span class="dy-loading dy-loading-infinity dy-loading-xl select-none"></span>
        {#await new Promise((r) => setTimeout(r, 5000)) then}
          <RefreshButton text="Already added the bot? Refresh!" whatInvalidate={page.url} />
        {/await}
      </div>
    {:else}
      <main>
        {@render children()}
      </main>
    {/if}
    <Footer year={data.ccDate} />

    {#if width < mediaQuery.md}
      <MobileNavigation />
    {/if}
  </div>
</div>

{#if true}
  <SaveAlert payload={{}} method="PATCH" destination="/" />
{/if}

<ServerSelectDialog />

<style>
  .page-container {
    height: 100vh;
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
    grid-template-areas: "main";

    @media screen and (min-width: 768px) {
      grid-template-columns: 18rem 1rem 1fr;
      grid-template-areas: "nav div main";
    }
  }

  .main-container {
    position: relative;
    display: block;
    grid-area: main;
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }

  .gradient-divider {
    grid-area: div;
    width: 1rem;
  }
</style>
