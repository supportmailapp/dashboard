<script lang="ts">
  import { browser } from "$app/environment";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import AppSidebar from "$lib/components/app-sidebar.svelte";
  import { cdnUrls } from "$lib/urls";
  import { cn } from "$lib/utils";
  import * as Avatar from "$ui/avatar";
  import { Button } from "$ui/button";
  import * as Sidebar from "$ui/sidebar/index.js";
  import { Skeleton } from "$ui/skeleton";
  import { innerWidth } from "svelte/reactivity/window";
  import { fade, slide } from "svelte/transition";
  import { IsMobile } from "$lib/hooks/is-mobile.svelte";
  import Mounter from "./Mounter.svelte";
  import ServerSelector from "./ServerSelector.svelte";
  import { mode } from "mode-watcher";

  let { children } = $props();

  let switchingPage = $state(true);
  let sidebarOpen = $state(true);
  let currentGuild = $derived(page.data.guildsManager.currentGuild);
  let guildsSelectOpen = $state(false);

  const isMobile = new IsMobile();

  $effect(() => {
    if (browser && innerWidth.current) {
      sidebarOpen = innerWidth.current >= 768;
    }
    if (!page.data.guildsManager.loaded) page.data.guildsManager.loadGuilds();

    return () => {
      console.log("Clearing current guild...");
      sidebarOpen = false;
    };
  });

  beforeNavigate((nav) => {
    if (nav.from?.url.pathname === nav.to?.url.pathname) {
      nav.cancel();
      return;
    }

    switchingPage = true;
    guildsSelectOpen = false;
  });

  afterNavigate(() => {
    switchingPage = false;
  });

  $effect(() => {
    return () => {
      console.log("Destroying...");
    };
  });
</script>

<Mounter />

<Sidebar.Provider bind:open={sidebarOpen} class="h-svh">
  <AppSidebar
    onClick={() => {
      if (Sidebar.useSidebar().openMobile) {
        sidebarOpen = false;
      }
    }}
  />
  <Sidebar.Inset class="main-container">
    <header
      class={cn(
        "bg-background text-sidebar-foreground sticky top-0 z-10 flex h-(--main-header-height) items-center justify-between p-3 shadow-lg border-b-2",
        mode.current !== "dark" ? "shadow-accent/40" : "shadow-black/30",
      )}
    >
      <Sidebar.Trigger />

      <!-- Server Selector in Center -->
      <div class="flex items-center justify-center">
        <Button
          disabled={!currentGuild}
          variant="outline"
          size="lg"
          class={cn("w-[230px] justify-center shadow-md", !currentGuild && "cursor-not-allowed opacity-50")}
          onclick={() => (guildsSelectOpen = true)}
        >
          {#if currentGuild}
            <Avatar.Root class="size-7">
              <Avatar.Fallback>{currentGuild?.name.slice(0, 2)}</Avatar.Fallback>
              <Avatar.Image
                src={cdnUrls.guildIcon(currentGuild?.id, currentGuild?.icon, 128)}
                alt={currentGuild?.name}
              />
            </Avatar.Root>
            <span class="truncate text-center" transition:slide={{ duration: 200, axis: "x" }}>
              {currentGuild?.name}
            </span>
          {:else}
            <Skeleton class="h-7 w-8 rounded-full" />
            <Skeleton class="h-4 w-40" />
          {/if}
        </Button>
      </div>

      <!-- Branding on Right -->
      <div class="flex items-center">
        <a href="/" class="flex items-center gap-2 transition-opacity duration-150 hover:opacity-70">
          {#if !isMobile.current}
            <span class="text-lg font-bold" transition:slide={{ duration: 200, axis: "x" }}>SupportMail</span>
          {/if}
          <Avatar.Root class="aspect-square size-8">
            <Avatar.Image src="/logo.png" alt="Logo" />
            <Avatar.Fallback>SM</Avatar.Fallback>
          </Avatar.Root>
        </a>
      </div>
    </header>
    <main class="main-content overflow-y-auto p-3 md:p-5" transition:fade={{ duration: 200 }}>
      {@render children?.()}
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>

<ServerSelector bind:open={guildsSelectOpen} bind:switchingPage />

<style>
  :root {
    --main-header-height: 4rem;
  }
</style>
