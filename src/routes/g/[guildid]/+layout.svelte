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
  import { blur } from "svelte/transition";

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
  {#if gg.guild}
    <button class="dy-btn dy-btn-neutral dy-btn-sm h-fit rounded-xl p-1" onclick={showServerSelect}>
      <img src={cdnUrls.guildIcon(gg.guild.id, gg.guild.icon, 64)} alt="Guild icon" class="size-7 rounded-full" />
      <span class="text-base font-semibold">{gg.guild.name}</span>
    </button>
    <button
      class="dy-btn dy-btn-sm dy-btn-ghost dy-btn-neutral h-fit p-1"
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
    <div class="dy-skeleton h-8 w-48 rounded"></div>
  {/if}
</div>

<div class="page-wrapper">
  {#if clientWidth > mediaQuery.md}
    <DesktopNavigation />
  {/if}
  <!-- Display server -->
  <div class="content-wrapper">
    {#if !site.showLoading}
      <main transition:blur={{ duration: 100 }}>
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
