<script lang="ts">
  import { page } from "$app/state";
  import { cdnUrls } from "$lib/utils/formatting";
  import { House, MessageSquareWarning, Ticket } from "@lucide/svelte";
  import { slide } from "svelte/transition";
  import { buildNavHref, showServerSelect } from "./navigation.svelte";
  import Footer from "./Footer.svelte";
  import { user } from "$lib/stores/user.svelte";

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
  <!-- Server Changing -->
  <div class="flex flex-row items-center justify-between gap-5">
    <div class="dy-tooltip dy-tooltip-bottom dy-tooltip-accent" data-tip="Preferences">
      <a href="/@me" class="">
        <div class="relative size-12 cursor-pointer rounded transition-all duration-100 hover:bg-slate-600">
          {#if user.discord}
            <img
              src={cdnUrls.userAvatar(user.discord.id, user.discord.avatar, 128)}
              alt="User icon"
              class="h-full w-full rounded-full"
            />
          {:else}
            <div class="h-full w-full rounded-full bg-slate-800 shadow-md">
              <div class="dy-skeleton h-full w-full rounded-full"></div>
            </div>
          {/if}
        </div>
      </a>
    </div>
  </div>

  <!-- Real Navigation -->
  <ul>
    {#each navItems as item}
      <li>
        <a href={item.slug} class="nav-btn h-fit {item.active ? 'active' : ''}">
          <span class="w-full px-4 text-center">{item.label}</span>
          <item.icon class="size-8" />
        </a>
      </li>
    {/each}
  </ul>

  <div class="mt-auto">
    <Footer />
  </div>
</nav>
