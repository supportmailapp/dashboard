<script lang="ts">
  import { page } from "$app/state";
  import { innerWidth } from "svelte/reactivity/window";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
  import Home from "@lucide/svelte/icons/home";
  import Menu from "@lucide/svelte/icons/menu";
  import Ticket from "@lucide/svelte/icons/ticket";
  import ShieldUser from "@lucide/svelte/icons/shield-user";
  import XIcon from "@lucide/svelte/icons/x";

  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { cn } from "$lib/utils";
  import { Avatar, AvatarFallback, AvatarImage } from "$ui/avatar";
  import { Button, buttonVariants } from "$ui/button";
  import * as Collapsible from "$ui/collapsible";
  import * as Command from "$ui/command";
  import * as Popover from "$ui/popover";
  import * as Sheet from "$ui/sheet";
  import { fade, slide } from "svelte/transition";
  import { getNextPathFromGuildPath } from "$lib";
  import { cdnUrls } from "$lib/urls";
  import { userDisplayName } from "$lib/utils/formatting";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { SvelteSet } from "svelte/reactivity";
  import { onDestroy } from "svelte";
  import { Skeleton } from "$ui/skeleton";
  import ToggleModeBtn from "$lib/components/ToggleModeBtn.svelte";

  let { children } = $props();
  let { isCurrentPage, guildHref } = page.data;
  let sidebarOpen = $state(false);
  let guildsSelectOpen = $state(false);
  let guildsManager = $derived(page.data.guildsManager);
  let currentGuild = $derived(guildsManager.currentGuild ?? null);

  //@ts-ignore
  $effect(async () => {
    if (!guildsManager.loaded) await guildsManager.loadGuilds();
  });

  const navItems = [
    {
      name: "Home",
      href: guildHref("/home"),
      icon: Home,
      current: function () {
        return isCurrentPage(this.href);
      },
    },
    {
      name: "Tickets",
      href: guildHref("/tickets"),
      icon: Ticket,
      current: function () {
        return isCurrentPage(this.href);
      },
      subItems: [
        { name: "All Tickets", href: guildHref("/tickets") },
        {
          name: "Categories",
          href: guildHref("/tickets/categories"),
        },
        { name: "Archive", href: guildHref("/tickets/archive") },
      ],
    },
    {
      name: "Blacklist",
      href: guildHref("/blacklist"),
      icon: ShieldUser,
      current: function () {
        return isCurrentPage(this.href);
      },
    },
  ];

  let openCollapsibles = new SvelteSet();

  let switchingPage = $state(true);

  beforeNavigate((nav) => {
    if (nav.from?.url.pathname === nav.to?.url.pathname) {
      nav.cancel();
      return;
    }

    switchingPage = true;
    sidebarOpen = false;
  });

  afterNavigate(() => {
    switchingPage = false;
  });

  onDestroy(() => {
    console.log("Destroying...");
  });
</script>

<div class="page-container">
  <!-- Desktop Sidebar -->
  {#if (innerWidth.current || 800) > 767}
    <div class="desktop-sidebar bg-card h-full border-r" in:slide={{ duration: 200, axis: "x" }}>
      <!-- Branding (Desktop) -->
      <div class="flex h-14 w-full items-center justify-center gap-2 border-b p-4">
        <!-- Branding -->
        <a href="/" class="flex items-center gap-2 transition-opacity duration-150 hover:opacity-70">
          <Avatar class="aspect-square size-8">
            <AvatarImage src="/logo.png" alt="Logo" />
            <AvatarFallback>SM</AvatarFallback>
          </Avatar>
          <span class="text-lg font-bold">SupportMail</span>
        </a>
      </div>

      <!-- Navigation Items (Desktop) -->
      <nav class="flex-1 overflow-auto p-4">
        <ul class="space-y-2">
          {#each navItems as item (item.name)}
            <li>
              {#if item.subItems}
                <Collapsible.Root
                  onOpenChange={(newOpen) => {
                    if (newOpen) openCollapsibles.add(item.name);
                    else openCollapsibles.delete(item.name);
                  }}
                >
                  <Collapsible.Trigger
                    class={cn(
                      buttonVariants({
                        variant: "secondary",
                      }),
                      "w-full justify-start",
                      item.current() ? "bg-muted" : "bg-transparent",
                    )}
                  >
                    <div class="flex items-center">
                      <item.icon class="mr-2 size-4" />
                      {item.name}
                    </div>
                    <ChevronRight
                      class={cn(
                        "ml-auto size-5 transform duration-80",
                        openCollapsibles.has(item.name) && "rotate-90",
                      )}
                    />
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <ul class="mt-1 space-y-1 pl-6">
                      {#each item.subItems as subItem}
                        <li>
                          <a
                            href={subItem.href}
                            class={cn(
                              buttonVariants({
                                variant: "secondary",
                              }),
                              "w-full justify-start",
                              isCurrentPage(subItem.href) ? "bg-secondary" : "bg-transparent",
                            )}
                          >
                            {subItem.name}
                          </a>
                        </li>
                      {/each}
                    </ul>
                  </Collapsible.Content>
                </Collapsible.Root>
              {:else}
                <Button
                  href={item.href}
                  class={cn(
                    buttonVariants({
                      variant: "secondary",
                    }),
                    "w-full justify-start",
                    item.current() ? "bg-secondary" : "bg-transparent",
                  )}
                >
                  <item.icon class="size-4" />
                  {item.name}
                </Button>
              {/if}
            </li>
          {/each}
        </ul>
      </nav>

      <!-- User Profile Link (Desktop) -->
      <div class="inline-flex items-center gap-1 border-t p-3">
        <Button href="/@me" size="lg" variant="outline" class={cn("flex-1 justify-between gap-2")}>
          <Avatar class="size-8">
            <AvatarFallback>{userDisplayName(page.data.user).slice(0, 2)}</AvatarFallback>
            <AvatarImage
              src={cdnUrls.userAvatar(page.data.user!.id, page.data.user!.avatar, 128)}
              alt="User"
            />
          </Avatar>
          <p class="w-full truncate text-sm font-medium">{userDisplayName(page.data.user)}</p>
          <ChevronRight class="size-4 opacity-50" />
        </Button>
        <ToggleModeBtn />
      </div>
    </div>
  {/if}

  <!-- Main Content -->
  <div class="main-container">
    <!-- Header -->
    <header class="flex h-14 items-center border-b px-4 md:px-6">
      <Popover.Root bind:open={guildsSelectOpen}>
        <Popover.Trigger
          disabled={!currentGuild}
          class={cn(
            buttonVariants({
              variant: "outline",
              size: "lg",
            }),
            "w-64 justify-between",
            !currentGuild && "cursor-not-allowed opacity-50",
          )}
        >
          {#if currentGuild}
            <Avatar class="size-8">
              <AvatarFallback>{currentGuild?.name.slice(0, 2)}</AvatarFallback>
              <AvatarImage
                src={cdnUrls.guildIcon(currentGuild?.id, currentGuild?.icon, 128)}
                alt={currentGuild?.name}
              />
            </Avatar>
            <span class="flex-1 truncate text-start">{currentGuild?.name}</span>
            <ChevronsUpDownIcon class="ml-2 opacity-50" />
          {:else}
            <Skeleton class="size-8 rounded-full" />
            <Skeleton class="h-4 w-40" />
            <ChevronsUpDownIcon class="ml-2 opacity-50" />
          {/if}
        </Popover.Trigger>
        <Popover.Content class="w-full max-w-72 p-0 *:w-full">
          <Command.Root>
            <Command.Input placeholder="Search server..." />
            <Command.List>
              <Command.Empty>No server found.</Command.Empty>
              <Command.Group value="guilds" class="max-h-64 space-y-1 overflow-y-auto">
                {#each guildsManager.guilds as guild (guild.id)}
                  {@const _guildHref = guild.isConfigured
                    ? `/g/${guild.id + getNextPathFromGuildPath(page.url.pathname)}`
                    : `/add/${guild.id}`}
                  <Command.Item
                    value={guild.name}
                    class={cn("p-0", !guild.isConfigured ? "opacity-50 hover:opacity-100" : "")}
                  >
                    <a
                      href={_guildHref}
                      target="_self"
                      class={cn(
                        "inline-flex h-full w-full items-center gap-2 px-2 py-1.5",
                        currentGuild?.id === guild.id && "bg-primary rounded",
                      )}
                    >
                      <Avatar class="size-6">
                        <AvatarFallback>{guild.name.slice(0, 2)}</AvatarFallback>
                        <AvatarImage src={cdnUrls.guildIcon(guild.id, guild.icon, 128)} alt={guild.name} />
                      </Avatar>
                      {guild.name}
                    </a>
                  </Command.Item>
                {/each}
              </Command.Group>
            </Command.List>
          </Command.Root>
        </Popover.Content>
      </Popover.Root>

      <Sheet.Root bind:open={sidebarOpen}>
        <Sheet.Trigger
          class={buttonVariants({
            variant: "outline",
            size: "icon",
            class: "ml-auto size-10 md:hidden",
          })}
        >
          <Menu class="size-5" />
        </Sheet.Trigger>
        <Sheet.Content side="right" class="w-64 p-0">
          <div
            class="bg-card flex h-full flex-col border-r"
            in:slide={{ duration: 150, axis: "x" }}
            out:slide={{ duration: 150, axis: "x" }}
          >
            <!-- Branding (Mobile) -->
            <div class="flex h-14 w-full items-center justify-start gap-2 border-b px-2">
              <!-- Branding -->
              <a href="/" class="flex items-center gap-2 transition-opacity duration-150 hover:opacity-70">
                <Avatar class="aspect-square size-8">
                  <AvatarImage src="/logo.png" alt="Logo" />
                  <AvatarFallback>SM</AvatarFallback>
                </Avatar>
                <span class="text-lg font-bold">SupportMail</span>
              </a>
              <Sheet.Close
                class={buttonVariants({
                  variant: "outline",
                  size: "icon",
                  class: "ml-auto",
                })}
                aria-label="Close Sidebar"
              >
                <XIcon class="size-5" />
                <span class="sr-only">Close</span>
              </Sheet.Close>
            </div>

            <!-- Navigation Items (Mobile) -->
            <nav class="flex-1 overflow-auto p-4">
              <ul class="space-y-2">
                {#each navItems as item (item.name)}
                  <li>
                    {#if item.subItems}
                      <Collapsible.Root
                        onOpenChange={(newOpen) => {
                          if (newOpen) openCollapsibles.add(item.name);
                          else openCollapsibles.delete(item.name);
                        }}
                      >
                        <Collapsible.Trigger
                          class={cn(
                            buttonVariants({
                              variant: "secondary",
                            }),
                            "w-full justify-start",
                            item.current() ? "bg-muted" : "bg-transparent",
                          )}
                        >
                          <div class="flex items-center">
                            <item.icon class="mr-2 size-4" />
                            {item.name}
                          </div>
                          <ChevronRight
                            class={cn(
                              "ml-auto size-5 transform duration-80",
                              openCollapsibles.has(item.name) && "rotate-90",
                            )}
                          />
                        </Collapsible.Trigger>
                        <Collapsible.Content>
                          <ul class="mt-1 space-y-1 pl-6">
                            {#each item.subItems as subItem}
                              <li>
                                <a
                                  href={subItem.href}
                                  class={cn(
                                    buttonVariants({
                                      variant: "secondary",
                                    }),
                                    "w-full justify-start",
                                    isCurrentPage(subItem.href) ? "bg-secondary" : "bg-transparent",
                                  )}
                                >
                                  {subItem.name}
                                </a>
                              </li>
                            {/each}
                          </ul>
                        </Collapsible.Content>
                      </Collapsible.Root>
                    {:else}
                      <Button
                        href={item.href}
                        class={cn(
                          buttonVariants({
                            variant: "secondary",
                          }),
                          "w-full justify-start",
                          item.current() ? "bg-secondary" : "bg-transparent",
                        )}
                      >
                        <item.icon class="size-4" />
                        {item.name}
                      </Button>
                    {/if}
                  </li>
                {/each}
              </ul>
            </nav>

            <!-- User Profile Link (Mobile) -->
            <div class="inline-flex items-center gap-1 border-t p-3">
              <Button href="/@me" size="lg" variant="outline" class={cn("flex-1 justify-between gap-2")}>
                <Avatar class="size-8">
                  <AvatarFallback>{userDisplayName(page.data.user).slice(0, 2)}</AvatarFallback>
                  <AvatarImage
                    src={cdnUrls.userAvatar(page.data.user!.id, page.data.user!.avatar, 128)}
                    alt="User"
                  />
                </Avatar>
                <p class="w-full truncate text-sm font-medium">{userDisplayName(page.data.user)}</p>
                <ChevronRight class="size-4 opacity-50" />
              </Button>
              <ToggleModeBtn />
            </div>
          </div>
        </Sheet.Content>
      </Sheet.Root>
    </header>

    <!-- Page Content -->
    {#if switchingPage}
      <main transition:fade={{ duration: 200 }}>
        <div class="flex h-full items-center justify-center">
          <LoadingSpinner />
        </div>
      </main>
    {:else}
      <main class="p-4 md:p-6" transition:fade={{ duration: 200 }}>
        {@render children?.()}
      </main>
    {/if}
  </div>
</div>

<style>
  .page-container {
    display: grid;
    grid-template-columns: 250px 1fr;
    height: 100vh;
    transition: grid-template-columns 200ms ease-in-out 200ms;

    @media screen and (max-width: 767px) {
      grid-template-columns: 1fr;
      transition: grid-template-columns 200ms ease-in-out 200ms;
    }

    .desktop-sidebar {
      display: flex;
      flex-direction: column;
    }
  }

  .main-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;

    header,
    main {
      width: 100%;
    }

    main {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 1rem;
      overflow-x: auto;
      overflow-y: scroll;
    }
  }
</style>
