<script lang="ts">
  import { page } from "$app/state";
  import { NavigationItems } from "$lib/constants";
  import { user } from "$lib/stores/user.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { House } from "@lucide/svelte";
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import Footer from "./Footer.svelte";
  import { buildNavHref } from "./navigation.svelte";

  function isCurrentPage(href: string = "/") {
    return page.url.pathname === href;
  }

  let baseNavItems = NavigationItems(page.params.guildid).filter((item) => item.id !== "premium");
  let premiumNavItem = NavigationItems(page.params.guildid).find((item) => item.id === "premium")!;

  let navItems = $derived([
    {
      id: "home",
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

  // Animation state variables
  let hoveredIndex = $state<number | null>(null);
  let activeIndex = $state<number | null>(null);
  let hoverStyle = $state<{ top?: string; height?: string }>({});
  let activeStyle = $state<{ top: string; height: string }>({ top: "0px", height: "0px" });
  let navItemRefs = $state<any[]>([]);

  // Initialize refs array
  $effect(() => {
    navItemRefs = Array(navItems.length).fill(null);
    activeIndex = navItems.findIndex((item) => item.active);
  });

  function updateHoverStyle() {
    if (hoveredIndex !== null) {
      const hoveredElement = navItemRefs[hoveredIndex];
      if (hoveredElement) {
        const { offsetTop, offsetHeight } = hoveredElement;
        hoverStyle = {
          top: `${offsetTop}px`,
          height: `${offsetHeight}px`,
        };
      }
    }
  }

  function updateActiveStyle() {
    const activeElement = navItemRefs[activeIndex!]; // Use non-null assertion
    if (activeElement) {
      const { offsetTop, offsetHeight } = activeElement;
      activeStyle = {
        top: `${offsetTop}px`,
        height: `${offsetHeight}px`,
      };
    }
  }

  // Update styles when values change
  $effect(() => {
    if (hoveredIndex !== null) {
      updateHoverStyle();
    }
  });

  $effect(() => {
    if (activeIndex !== undefined) {
      updateActiveStyle();
    }
  });

  onMount(() => {
    // Initialize active indicator position
    setTimeout(() => {
      updateActiveStyle();
    }, 0);
  });
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

  <!-- Real Navigation with animation indicators -->
  <div class="relative">
    <!-- Hover Highlight -->
    <div
      class="absolute w-full rounded-md bg-slate-700/20 transition-all duration-300 ease-out"
      style="top: {hoverStyle.top || '0px'}; height: {hoverStyle.height || '0px'}; opacity: {hoveredIndex !== null ? 1 : 0};"
    ></div>

    <!-- Active Indicator -->
    <div
      class="absolute left-0 w-[3px] bg-white transition-all duration-300 ease-out"
      style="top: {activeStyle.top}; height: {activeStyle.height};"
    ></div>

    <!-- Navigation Items -->
    <ul class="relative">
      {#each navItems as item, index}
        <li>
          <a
            href={item.href}
            bind:this={navItemRefs[index]}
            class="nav-btn {item.active ? 'active' : ''}"
            onmouseenter={() => (hoveredIndex = index)}
            onmouseleave={() => (hoveredIndex = null)}
            onclick={() => (activeIndex = index)}
          >
            <span class="w-full px-4 text-center {item.id == 'premium' ? 'text-amber-400' : ''}">{item.name}</span>
            <item.icon class="size-8 {item.id == 'premium' ? 'text-amber-400' : ''}" />
          </a>
        </li>
      {/each}
    </ul>
  </div>

  <div class="mt-auto">
    <Footer />
  </div>
</nav>
