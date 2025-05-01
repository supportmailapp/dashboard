<script lang="ts">
  import "./dashboard.css";
  import DesktopNavigation from "$lib/components/DesktopNavigation.svelte";
  import { gg, loadGuildData } from "$lib/stores/guild.svelte";
  import { onMount } from "svelte";
  import ServerSelectDialog from "$lib/components/ServerSelectDialog.svelte";
  import SaveAlert from "$lib/components/SaveAlert.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { showServerSelect } from "$lib/components/navigation.svelte";
  import { mediaQuery } from "$lib/constants";
  import { Files } from "@lucide/svelte";
  import { site } from "$lib/stores/site.svelte";
  import LoadingDots from "$lib/components/LoadingDots.svelte";
  import MobileNavigation from "$lib/components/MobileNavigation.svelte";
  import { scale } from "svelte/transition";

  let { children } = $props();
  let clientWidth = $state(0);

  onMount(() => {
    // Load guild data if needed
    if (!(gg.guild && gg.roles && gg.channels)) {
      console.log("Loading guild data...");
      loadGuildData();
    }
  });
</script>

<svelte:window bind:innerWidth={clientWidth} />

<ServerSelectDialog />

<div id="guild-header">
  <button
    class="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 transition-colors duration-100 hover:bg-slate-800"
    onclick={showServerSelect}
  >
    {#if gg.guild}
      <img src={cdnUrls.guildIcon(gg.guild.id, gg.guild.icon, 64)} alt="Guild icon" class="size-7 rounded-full" />
    {:else}
      <div class="size-8 rounded-full bg-slate-800 shadow-md">
        <div class="dy-skeleton h-full w-full rounded-full"></div>
      </div>
    {/if}
    <span class="text-base font-semibold">{gg.guild?.name || "..."}</span>
  </button>
  {#if gg.guild}
    <button
      class="flex flex-row items-center gap-1 rounded p-1 text-xs transition-colors duration-100 hover:bg-slate-800"
      onclick={() => {
        if (!gg.guild) return;
        navigator.clipboard.writeText(gg.guild.id || "Guild ID not found - please report this issue.");
        alert("Server ID copied to clipboard!");
      }}
    >
      <Files size={18} />
      <span class="hidden sm:block">Copy ID</span>
    </button>
  {:else}
    <div class="flex flex-row items-center gap-1 rounded p-1 text-xs">
      <div class="dy-skeleton h-4 w-16 rounded"></div>
    </div>
  {/if}
</div>

<div class="page-wrapper">
  {#if clientWidth > mediaQuery.md}
    <DesktopNavigation />
  {/if}
  <!-- Display server -->
  <div class="content-wrapper">
    {#if !site.showLoading}
      <main>
        {@render children()}
      </main>
    {:else}
      <div class="flex h-full w-full items-center justify-center">
        <LoadingDots />
      </div>
    {/if}
  </div>
</div>

<SaveAlert />
