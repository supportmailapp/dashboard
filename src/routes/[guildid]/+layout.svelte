<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";

  import DesktopNavigation from "$lib/components/DesktopNavigation.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import MobileNavigation from "$lib/components/MobileNavigation.svelte";
  import NavigationDialog from "$lib/components/NavigationDialog.svelte";
  import { APIRoutes, mediaQuery } from "$lib/constants.js";
  import { gg, loadGuildConfig, loadGuildData, unsavedChanges } from "$lib/stores/guild.svelte";
  import { site } from "$lib/stores/site.svelte.js";
  import { goto } from "$app/navigation";

  let { children, data } = $props();

  let innerWidth = $state(800);

  onMount(async function () {
    if (!gg.guild || page.params.guildid !== gg.guild.id) {
      await loadGuildConfig(page.params.guildid);
      await loadGuildData(page.params.guildid);
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

    const redirect = window.localStorage.getItem("redirect_guild");
    if (redirect && gg.guild && window.location.pathname == `/${gg.guild.id}`) {
      window.localStorage.removeItem("redirect_guild");
      window.localStorage.removeItem("redirect_base");
      goto(`/${gg.guild.id}` + redirect);
    }
  });
</script>

<svelte:window bind:innerWidth />

<div class="flex min-h-screen w-full max-w-screen flex-row overflow-x-hidden">
  {#if innerWidth >= mediaQuery.md}
    <DesktopNavigation />
  {/if}

  <div class="w-full">
    <div class="flex min-h-screen flex-col p-3 text-wrap" transition:slide={{ duration: 250, axis: "x" }}>
      {@render children()}
    </div>
    <Footer year={data.ccDate} />
  </div>
</div>

{#if innerWidth < mediaQuery.md}
  <MobileNavigation />
{/if}

{#if unsavedChanges}
  <!-- <SaveModal  /> -->
{/if}

<NavigationDialog />
