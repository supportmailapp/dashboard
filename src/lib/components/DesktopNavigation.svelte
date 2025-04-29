<script lang="ts">
  import { page } from "$app/state";
  import { cdnUrls } from "$lib/utils/formatting";
  import { House } from "@lucide/svelte";
  import { slide } from "svelte/transition";
  import { buildNavHref } from "./navigation.svelte";
  import Footer from "./Footer.svelte";
  import { user } from "$lib/stores/user.svelte";
  import { NavigationItems } from "$lib/constants";

  function isCurrentPage(href: string = "/") {
    return page.url.pathname === href;
  }

  let baseNavItems = NavigationItems(page.params.guildid).filter((item) => item.id !== "premium");
  let premiumNavItem = NavigationItems(page.params.guildid).find((item) => item.id === "premium")!;

  let navItems = $derived([
    {
      name: "Home",
      icon: House,
      active: isCurrentPage(buildNavHref("/")),
      href: buildNavHref("/"),
      color: "text-slate-200",
    },
    {
      ...premiumNavItem,
      active: isCurrentPage(premiumNavItem.href),
    },
    ...baseNavItems.map((item) => ({
      ...item,
      active: isCurrentPage(item.href),
    })),
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
        <a href={item.href} class="nav-btn {item.active ? 'active' : ''}">
          <span class="w-full px-4 text-center">{item.name}</span>
          <item.icon class="size-8" />
        </a>
      </li>
    {/each}
  </ul>

  <div class="mt-auto">
    <Footer />
  </div>
</nav>
