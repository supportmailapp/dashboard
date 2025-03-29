<script lang="ts">
  import { page } from "$app/state";
  import { gg } from "$lib/stores/guild.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { ArrowLeftRight, House, MessageSquareWarning, Ticket } from "@lucide/svelte";
  import { slide } from "svelte/transition";
  import { buildNavHref, showServerSelect } from "./navigation.svelte";

  function isCurrentPage(href: string = "/") {
    return page.url.pathname === href;
  }

  const navItems = $derived([
    {
      label: "Home",
      icon: House,
      active: isCurrentPage(buildNavHref("/")),
      slug: buildNavHref("/"),
    },
    {
      label: "Tickets",
      icon: Ticket,
      active: isCurrentPage(buildNavHref("/tickets")),
      slug: buildNavHref("/tickets"),
    },
    {
      label: "Reports",
      icon: MessageSquareWarning,
      active: isCurrentPage(buildNavHref("/reports")),
      slug: buildNavHref("/reports"),
    },
  ]);
</script>

<nav class="desktop-nav" transition:slide={{ duration: 350, axis: "x" }}>
  <div class="mb-5 flex h-16 flex-col items-center justify-center px-2">
    <button class="hover:opacity-80" onclick={showServerSelect} aria-label="Switch Server">
      <div class="relative size-12">
        {#if gg.guild}
          <img
            src={cdnUrls.guildIcon(gg.guild.id, gg.guild?.icon, 128)}
            alt="Server icon"
            class="h-full w-full rounded-full border-0 object-cover"
          />
          <ArrowLeftRight class="bg-base-100 absolute -right-0.5 -bottom-0.5 size-5 rounded-full p-0.5 shadow-md" />
        {:else}
          <div class="h-full w-full rounded-full bg-slate-800 shadow-md">
            <div class="dy-skeleton h-full w-full rounded-full"></div>
          </div>
        {/if}
      </div>
    </button>
  </div>
  <div class="flex flex-col items-center gap-2">
    {#each navItems as item}
      <a href={item.slug} class="nav-btn h-fit {item.active ? 'active' : ''}">
        <span class="w-full text-center px-4">{item.label}</span>
        <item.icon class="size-8" />
      </a>
    {/each}
  </div>
</nav>
