<script lang="ts">
  import ChevronDownUp from "@lucide/svelte/icons/chevrons-down-up";

  import { browser } from "$app/environment";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import { getNextPathFromGuildPath } from "$lib";
  import AppSidebar from "$lib/components/app-sidebar.svelte";
  import { cdnUrls } from "$lib/urls";
  import { cn } from "$lib/utils";
  import * as Avatar from "$ui/avatar";
  import { buttonVariants } from "$ui/button";
  import * as Command from "$ui/command";
  import * as Popover from "$ui/popover/index.js";
  import * as Sidebar from "$ui/sidebar/index.js";
  import { Skeleton } from "$ui/skeleton";
  import { innerWidth } from "svelte/reactivity/window";
  import { MediaQuery } from "svelte/reactivity";
  import { fade, fly, scale, slide } from "svelte/transition";
  import { IsMobile } from "$lib/hooks/is-mobile.svelte";

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

<Sidebar.Provider bind:open={sidebarOpen}>
  <AppSidebar />
  <Sidebar.Inset class="main-container">
    <header class="main-header bg-sidebar text-sidebar-foreground flex items-center justify-between p-3">
      <Sidebar.Trigger />

      <!-- Server Selector in Center -->
      <div class="flex flex-1 items-center justify-center">
        <Popover.Root bind:open={guildsSelectOpen}>
          <Popover.Trigger
            disabled={!currentGuild}
            class={cn(
              buttonVariants({
                variant: "outline",
                size: "lg",
              }),
              "max-w-xs",
              !currentGuild && "cursor-not-allowed opacity-50",
            )}
          >
            {#if currentGuild}
              <Avatar.Root class="size-8">
                <Avatar.Fallback>{currentGuild?.name.slice(0, 2)}</Avatar.Fallback>
                <Avatar.Image
                  src={cdnUrls.guildIcon(currentGuild?.id, currentGuild?.icon, 128)}
                  alt={currentGuild?.name}
                />
              </Avatar.Root>
              {#if !isMobile.current}
                <span class="flex-1 truncate text-start" transition:slide={{ duration: 200, axis: "x" }}>
                  {currentGuild?.name}
                </span>
              {/if}
              <ChevronDownUp class="ml-2 opacity-50" />
            {:else}
              <Skeleton class="size-8 rounded-full" />
              <Skeleton class="h-4 w-40" />
              <ChevronDownUp class="ml-2 opacity-50" />
            {/if}
          </Popover.Trigger>
          <Popover.Content class="w-xs p-0 *:w-full">
            <Command.Root>
              <Command.Input placeholder="Search server..." />
              <Command.List>
                <Command.Empty>No server found.</Command.Empty>
                <Command.Group value="guilds" class="max-h-64 space-y-1 overflow-y-auto">
                  {#each page.data.guildsManager.guilds as guild (guild.id)}
                    {@const _guildHref = guild.isConfigured
                      ? `/g/${guild.id + getNextPathFromGuildPath(page.url.pathname)}`
                      : `/add/${guild.id}`}
                    <Command.LinkItem
                      href={_guildHref}
                      value={guild.name}
                      class={cn(!guild.isConfigured && "opacity-80 hover:opacity-100")}
                    >
                      <Avatar.Root class="size-6">
                        <Avatar.Fallback>{guild.name.slice(0, 2)}</Avatar.Fallback>
                        <Avatar.Image src={cdnUrls.guildIcon(guild.id, guild.icon, 128)} alt={guild.name} />
                      </Avatar.Root>
                      {guild.name}
                    </Command.LinkItem>
                  {/each}
                </Command.Group>
              </Command.List>
            </Command.Root>
          </Popover.Content>
        </Popover.Root>
      </div>

      <!-- Branding on Right -->
      <div class="flex items-center">
        <a href="/" class="flex items-center gap-2 transition-opacity duration-150 hover:opacity-70">
          <Avatar.Root class="aspect-square size-8">
            <Avatar.Image src="/logo.png" alt="Logo" />
            <Avatar.Fallback>SM</Avatar.Fallback>
          </Avatar.Root>
          {#if !isMobile.current}
            <span class="text-lg font-bold" transition:slide={{ duration: 200, axis: "x" }}>SupportMail</span>
          {/if}
        </a>
      </div>
    </header>
    <main class="main-content p-3 md:p-5" transition:fade={{ duration: 200 }}>
      {@render children?.()}
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>

<style>
  main {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 1rem;
    overflow-x: auto;
    overflow-y: scroll;
  }
</style>
