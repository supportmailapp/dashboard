<script lang="ts">
  import "../app.css";
  import { page } from "$app/state";
  import {
    Menu,
    ChevronDown,
    ChevronRight,
    Home,
    Ticket,
    Users,
    Bot,
    ChevronsUpDownIcon,
    CheckIcon,
  } from "@lucide/svelte";

  import { Button, buttonVariants } from "$lib/components/ui/button";
  import { Avatar, AvatarImage, AvatarFallback } from "$lib/components/ui/avatar";
  import * as Sheet from "$lib/components/ui/sheet";
  import * as Collapsible from "$lib/components/ui/collapsible";
  import { slide } from "svelte/transition";
  import * as Popover from "$lib/components/ui/popover";
  import * as Command from "$lib/components/ui/command";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { cn } from "$lib/utils";

  let { children } = $props();
  let isMobile = $state(false);
  let activeGuild = $state({ id: "123456789012345678", name: "Coding Haven", icon: "CH" });
  let sidebarOpen = $state(false);
  let guildsSelectOpen = $state(false);
  let guilds = $state([
    { id: "123456789012345678", name: "Coding Haven", icon: "CH" },
    { id: "234567890123456789", name: "Gaming Guild", icon: "GG" },
    { id: "345678901234567890", name: "Music Lovers", icon: "ML" },
    { id: "456789012345678901", name: "Art Community", icon: "AC" },
    { id: "567890123456789012", name: "Tech Enthusiasts", icon: "TE" },
    { id: "678901234567890123", name: "Book Club", icon: "BC" },
    { id: "789012345678901234", name: "Travel Buddies", icon: "TB" },
  ]);

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      current: page.url.pathname === "/",
    },
    {
      name: "Tickets",
      href: "/tickets",
      icon: Ticket,
      current: page.url.pathname.startsWith("/tickets"),
      subItems: [
        { name: "All Tickets", href: "/tickets" },
        {
          name: "Categories",
          href: "/tickets/categories",
        },
        { name: "Archive", href: "/tickets/archive" },
      ],
    },
    {
      name: "Users",
      href: "/users",
      icon: Users,
      current: page.url.pathname.startsWith("/users"),
    },
    {
      name: "Bot Settings",
      href: "/settings",
      icon: Bot,
      current: page.url.pathname.startsWith("/settings"),
      subItems: [
        { name: "General", href: "/settings" },
        { name: "Commands", href: "/settings/commands" },
        {
          name: "Permissions",
          href: "/settings/permissions",
        },
      ],
    },
  ];

  function handleResize(width: number) {
    isMobile = width < 768;
  }

  let switchingPage = $state(true);

  beforeNavigate(() => {
    switchingPage = true;
    sidebarOpen = false;
  });

  afterNavigate(() => {
    switchingPage = false;
  });
</script>

<svelte:window
  {@attach (e) => handleResize(e.innerWidth)}
  onresize={(e) => handleResize(e.currentTarget.innerWidth)}
/>

<!-- Desktop Sidebar -->
<div class="bg-card hidden w-64 flex-col border-r md:flex">
  <!-- Branding (Desktop) -->
  <div class="flex h-14 items-center gap-2 border-b p-4">
    <!-- Branding -->
    <div class="flex items-center gap-2">
      <Avatar class="aspect-square size-8">
        <AvatarImage src="/logo.png" alt="Logo" />
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <span class="text-lg font-bold">Discord Bot</span>
    </div>
  </div>

  <!-- Navigation Items (Desktop) -->
  <nav class="flex-1 overflow-auto p-4">
    <ul class="space-y-2">
      {#each navItems as item}
        <li>
          {#if item.subItems}
            <Collapsible.Root>
              <Collapsible.Trigger
                class={buttonVariants({
                  variant: "ghost",
                  size: "default",
                  class: "w-full justify-start",
                })}
              >
                <div class="flex items-center">
                  <item.icon class="mr-2 size-4" />
                  {item.name}
                </div>
                <ChevronRight class="ml-auto size-4 transition-transform" />
              </Collapsible.Trigger>
              <Collapsible.Content>
                <ul class="mt-1 space-y-1 pl-6">
                  {#each item.subItems as subItem}
                    <li>
                      <a
                        href={subItem.href}
                        class={buttonVariants({
                          variant: "ghost",
                          size: "default",
                          class: "w-full justify-start",
                        })}
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
              variant="ghost"
              href={item.href}
              class={buttonVariants({
                variant: "ghost",
                size: "default",
                class: "w-full justify-start gap-3",
              })}
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
  <div class="border-t p-3">
    <Button href="/@me" size="lg" variant="outline" class={cn("w-full justify-between gap-3 py-5")}>
      <Avatar class="size-8">
        <AvatarFallback>UN</AvatarFallback>
        <AvatarImage src="/avatar.png" alt="User" />
      </Avatar>
      <p class="w-full truncate text-sm font-medium">Username</p>
      <ChevronRight class="size-4 opacity-50" />
    </Button>
  </div>
</div>

<!-- Main Content -->
<div class="flex flex-1 flex-col overflow-hidden">
  <!-- Header -->
  <header class="flex h-14 items-center border-b px-4 md:px-6">
    <Popover.Root bind:open={guildsSelectOpen}>
      <Popover.Trigger>
        <Button
          variant="outline"
          size="lg"
          class="w-52 justify-between"
          role="combobox"
          aria-expanded={guildsSelectOpen}
        >
          <Avatar class="size-8">
            <AvatarFallback>{activeGuild.icon}</AvatarFallback>
          </Avatar>
          <span class="max-w-50 truncate">{activeGuild.name}</span>
          <ChevronsUpDownIcon class="ml-2 opacity-50" />
        </Button>
      </Popover.Trigger>
      <Popover.Content class="w-full max-w-72 p-0 *:w-full">
        <Command.Root>
          <Command.Input placeholder="Search server..." />
          <Command.List>
            <Command.Empty>No server found.</Command.Empty>
            <Command.Group value="guilds" class="max-h-64 space-y-1 overflow-y-auto">
              {#each guilds as guild (guild.id)}
                <Command.Item
                  value={guild.name}
                  onSelect={() => {
                    // TODO: implement goto()
                    activeGuild = guild;
                    guildsSelectOpen = false;
                  }}
                >
                  <CheckIcon class={cn(activeGuild.id !== guild.id && "text-transparent")} />
                  <Avatar class="size-6">
                    <AvatarFallback>{guild.icon}</AvatarFallback>
                  </Avatar>
                  {guild.name}
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
          size: "default",
          class: "ml-auto md:hidden",
        })}
      >
        <Menu />
      </Sheet.Trigger>
      <Sheet.Content side="right" class="w-64 p-0">
        <div class="flex h-full flex-col">
          <!-- Branding (Desktop) -->
          <div class="flex h-14 items-center gap-2 border-b p-4">
            <!-- Branding -->
            <div class="flex items-center gap-2">
              <Avatar class="aspect-square size-8">
                <AvatarImage src="/logo.png" alt="Logo" />
                <AvatarFallback>SM</AvatarFallback>
              </Avatar>
              <span class="text-lg font-bold">Discord Bot</span>
            </div>
          </div>

          <!-- Navigation Items (Mobile) -->
          <nav class="flex-1 overflow-auto p-4">
            <ul class="space-y-2">
              {#each navItems as item}
                <li>
                  {#if item.subItems}
                    <Collapsible.Root>
                      <Collapsible.Trigger
                        class={buttonVariants({
                          variant: "ghost",
                          size: "default",
                          class: "w-full justify-start",
                        })}
                      >
                        <div class="flex items-center">
                          <item.icon class="mr-2 size-4" />
                          {item.name}
                        </div>
                        <ChevronRight class="ml-auto size-4 transition-transform" />
                      </Collapsible.Trigger>
                      <Collapsible.Content>
                        <ul class="mt-1 space-y-1 pl-6">
                          {#each item.subItems as subItem}
                            <li>
                              <a
                                href={subItem.href}
                                class={buttonVariants({
                                  variant: "ghost",
                                  size: "default",
                                  class: "w-full justify-start",
                                })}
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
                      variant="ghost"
                      href={item.href}
                      class={buttonVariants({
                        variant: "ghost",
                        size: "default",
                        class: "w-full justify-start gap-3",
                      })}
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
          <a href="/@me" class="hover:bg-card border-t p-4">
            <div class="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="/avatar.png" alt="User" />
                <AvatarFallback>UN</AvatarFallback>
              </Avatar>
              <div>
                <p class="text-sm font-medium">Username</p>
                <p class="text-muted-foreground text-xs">View Profile</p>
              </div>
            </div>
          </a>
        </div>
      </Sheet.Content>
    </Sheet.Root>
  </header>

  <!-- Page Content -->
  {#if switchingPage}
    <main class="flex-1 overflow-auto" transition:slide={{ duration: 200, axis: "y" }}>
      <div class="flex h-full items-center justify-center">
        <p class="text-muted-foreground">Loading...</p>
      </div>
    </main>
  {:else}
    <main class="flex-1 overflow-auto p-4 md:p-6" transition:slide={{ duration: 200, axis: "y" }}>
      {@render children?.()}
    </main>
  {/if}
</div>
