<script lang="ts">
  import Home from "$lib/assets/home.svelte";
  import type { Snippet } from "svelte";
</script>

{#snippet dNavbarGroupHeader(name: string, iconPath: string)}
  <div class="text-neutral-content container mt-3 text-sm">
    <div class="flex items-center gap-1.5 pl-2">
      <img src={iconPath} alt={name} class="aspect-square h-5" />
      <h2 class="font-wide text-md font-semibold">{name}</h2>
    </div>
  </div>
{/snippet}

{#snippet dNavbarItem(name: string, href: string, icon: string | Snippet, active = false)}
  <a class="dy-btn dy-btn-ghost container" {href}>
    <div class="flex items-center gap-1.5 pl-1">
      {#if typeof icon == "string"}
        <img src={icon} alt={name} class="aspect-square h-5" />
      {:else}
        {@render icon()}
      {/if}
      <h2 class="font-wide text-xl font-semibold">{name}</h2>
    </div>
  </a>
{/snippet}

<div class="flex flex-col gap-y-1">
  <a class="dy-btn dy-btn-ghost container" href="/">
    <div class="flex items-center gap-1.5 pl-1">
      <Home color="white" />
      <h2 class="font-wide text-xl font-semibold">Overview</h2>
    </div>
  </a>
  {@render dNavbarGroupHeader("Test", "/icons/controls.svg")}
  {@render dNavbarItem("Tickets", "/tickets", "/icons/ticket.svg")}
</div>
