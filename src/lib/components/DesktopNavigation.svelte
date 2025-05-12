<script lang="ts">
  import { page } from "$app/state";
  import { NavigationItems } from "$lib/constants";
  import { user } from "$lib/stores/user.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { House } from "@lucide/svelte";
  import { slide, fade } from "svelte/transition";
  import Footer from "./Footer.svelte";
  import { buildNavHref } from "./navigation.svelte";

  function isCurrentPage(href: string = "/") {
    return page.url.pathname === href;
  }

  function isSubPage(href: string) {
    return page.url.pathname.startsWith(href) && page.url.pathname !== href;
  }

  let baseNavItems = NavigationItems(page.params.guildid).filter((item) => item.id !== "premium");
  let premiumNavItem = NavigationItems(page.params.guildid).find((item) => item.id === "premium")!;

  let navItems: NavItem[] = $derived([
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

<nav class="desktop-nav overflow-visible" transition:slide={{ duration: 350, axis: "x" }}>
  <!-- Server Changing -->
  <div class="flex flex-row items-center justify-between gap-5">
    <div class="dy-tooltip dy-tooltip-right dy-tooltip-accent" data-tip="Preferences">
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
  <div style="position: relative; width: 100%;">
    <!-- Navigation Items -->
    <ul class="relative">
      <li>
        <a href={buildNavHref()} class="nav-btn nav-parent" class:active={isCurrentPage(buildNavHref())}>
          <span class="w-full text-center">Home</span>
          <House class="size-8" />
        </a>
      </li>
      {#each navItems as item}
        <li>
          <a href={item.href} class="nav-btn nav-parent" class:active={item.active} class:subpage-active={isSubPage(item.href)}>
            <item.icon class="size-8 {item.id === 'premium' ? 'text-yellow-400' : ''}" />
            <span class="w-aut" class:text-amber-400={item.id == "premium"}>{item.name}</span>
          </a>
          {#if item.children?.length && page.url.pathname.startsWith(item.href)}
            <ul class="nav-submenu" transition:fade={{ duration: 200 }}>
              <div class="bg-neutral w-1 rounded"></div>
              {#each item.children as child}
                <li>
                  <a href={child.href} class="nav-btn nav-child" class:active={isCurrentPage(child.href)}>
                    <child.icon class="size-6" />
                    <span class="w-auto">{child.name}</span>
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
        </li>
      {/each}
    </ul>
  </div>

  <div class="mt-auto w-full">
    <Footer />
  </div>
</nav>
