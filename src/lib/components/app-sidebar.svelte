<script lang="ts">
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import Cog from "@lucide/svelte/icons/cog";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import Home from "@lucide/svelte/icons/home";
  import LogOut from "@lucide/svelte/icons/log-out";
  import MessagesSquare from "@lucide/svelte/icons/messages-square";
  import Moon from "@lucide/svelte/icons/moon";
  import LifeBuoy from "@lucide/svelte/icons/life-buoy";
  import BookCheck from "@lucide/svelte/icons/book-check";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import Settings from "@lucide/svelte/icons/settings";
  import ShieldUser from "@lucide/svelte/icons/shield-user";
  import Star from "@lucide/svelte/icons/star";
  import Sun from "@lucide/svelte/icons/sun";
  import Table from "@lucide/svelte/icons/table";
  import Ticket from "@lucide/svelte/icons/ticket";
  import Section from "@lucide/svelte/icons/section";
  import SquareSlash from "@lucide/svelte/icons/square-slash";

  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import VenocixBranding from "$lib/assets/VenocixBranding.svelte";
  import { cdnUrls } from "$lib/urls";
  import { cn } from "$lib/utils";
  import { userDisplayName } from "$lib/utils/formatting";
  import * as Avatar from "$ui/avatar";
  import { buttonVariants } from "$ui/button";
  import * as DropdownMenu from "$ui/dropdown-menu/index.js";
  import * as Sidebar from "$ui/sidebar/index.js";
  import * as Dialog from "$ui/dialog/index.js";
  import { mode, toggleMode } from "mode-watcher";
  import type { Component } from "svelte";
  import { toast } from "svelte-sonner";
  import { getManager } from "$lib/stores/GuildsManager.svelte";
  import Slider from "$ui/slider/slider.svelte";
  import { getSnowflakes } from "$lib/stores/SnowflakeControls.svelte";
  import { guildHref, isCurrentPage } from "$lib/stores/site.svelte";

  type NavItem = {
    id: string;
    name: string;
    href: string;
    icon: Component<any>;
  };

  type NavCategory = {
    id: string;
    name: string;
    items: NavItem[];
  };

  const navCategories: (NavCategory | NavItem)[] = [
    {
      id: "home",
      name: "Home",
      href: "/home",
      icon: Home,
    },
    {
      id: "tickets",
      name: "Tickets",
      items: [
        {
          id: "view-tickets",
          name: "View Tickets",
          href: "/tickets",
          icon: Ticket,
        },
        {
          id: "ticket-settings",
          name: "Ticket Settings",
          href: "/ticket-settings",
          icon: Cog,
        },
        {
          id: "ticket-categories",
          name: "Ticket Categories",
          href: "/ticket-categories",
          icon: FolderOpen,
        },
        {
          id: "feedback",
          name: "Feedback",
          href: "/feedback",
          icon: Star,
        },
      ],
    },
    {
      id: "moderation",
      name: "Moderation",
      items: [
        {
          id: "view-reports",
          name: "View Reports",
          href: "/reports",
          icon: Table,
        },
        {
          id: "report-settings",
          name: "Report Settings",
          href: "/report-settings",
          icon: Cog,
        },
        {
          id: "blacklist",
          name: "Blacklist Management",
          href: "/blacklist",
          icon: ShieldUser,
        },
      ],
    },
    {
      id: "other",
      name: "Other",
      items: [
        {
          id: "tags",
          name: "Tags",
          href: "/tags",
          icon: MessagesSquare,
        },
        {
          id: "command-config",
          name: "Command Config",
          href: "/command-config",
          icon: SquareSlash
        },
      ],
    },
  ];

  const snowflakes = getSnowflakes();
  const guildsManager = getManager();
  let reloadBtnDisabled = $state(false);
  let snowflakeControlsOpen = $state(false);
  let atMeHref = $derived(`/@me?back=${encodeURIComponent(page.url.pathname)}`);

  async function reloadGuildData() {
    if (reloadBtnDisabled) return;
    reloadBtnDisabled = true;
    await guildsManager.loadChannels();
    await guildsManager.loadRoles();

    toast.success("Channels and roles reloaded!");

    setTimeout(() => {
      reloadBtnDisabled = false;
    }, 10_000);
  }

  let { onClick }: { onClick?: () => void } = $props();
</script>

<Sidebar.Root side="left" variant="sidebar" class="select-none">
  <Sidebar.Content>
    {#each navCategories as item, index (item.id)}
      <Sidebar.Group>
        {#if "href" in item}
          {@const href = guildHref(item.href)}
          <Sidebar.Menu>
            {#if index === 0}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton
                  onclick={reloadGuildData}
                  class="justify-center transition-all duration-100 ease-in-out"
                  variant="outline"
                  aria-disabled={reloadBtnDisabled}
                >
                  <RotateCcw />
                  <span>Reload Channels & Roles</span>
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {/if}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={isCurrentPage(item.href, false)}>
                {#snippet child({ props })}
                  <a {href} {...props} onclick={onClick}>
                    <item.icon />
                    <span>{item.name}</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        {:else}
          <Sidebar.GroupLabel>{item.name}</Sidebar.GroupLabel>
          <Sidebar.GroupContent>
            <Sidebar.Menu>
              {#each item.items as subItem (subItem.id)}
                {@const href = guildHref(subItem.href)}
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton isActive={isCurrentPage(subItem.href, true)}>
                    {#snippet child({ props })}
                      <a {href} {...props} onclick={onClick}>
                        <subItem.icon />
                        <span>{subItem.name}</span>
                      </a>
                    {/snippet}
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
              {/each}
            </Sidebar.Menu>
          </Sidebar.GroupContent>
        {/if}
      </Sidebar.Group>
    {/each}
    <Sidebar.Group class="mt-auto">
      <VenocixBranding />
    </Sidebar.Group>
  </Sidebar.Content>
  <Sidebar.Footer>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full  text-start")}
          >
            <Avatar.Root class="size-7">
              <Avatar.Fallback>{userDisplayName(page.data.user).slice(0, 2)}</Avatar.Fallback>
              <Avatar.Image
                src={cdnUrls.userAvatar(page.data.user!.id, page.data.user!.avatar, 128)}
                alt="User"
              />
            </Avatar.Root>
            <p class="w-full truncate text-sm font-medium">{userDisplayName(page.data.user)}</p>
            <ChevronUp class="ml-auto size-4 opacity-60" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content side="top" class="w-(--bits-dropdown-menu-anchor-width)">
            <DropdownMenu.Item onclick={() => goto(atMeHref)}>
              <Settings />
              <!-- TODO Later: <span>Me & Billing</span> -->
              <span>My Settings</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item closeOnSelect={false} onclick={() => toggleMode()}>
              {#if mode.current === "dark"}
                <Moon />
              {:else}
                <Sun />
              {/if}
              <span>Toggle Theme</span>
            </DropdownMenu.Item>
            <!-- <DropdownMenu.Item onSelect={() => (snowflakeControlsOpen = true)}>
              Snowflake Controls
            </DropdownMenu.Item> -->
            <DropdownMenu.Separator />
            <DropdownMenu.Item onclick={() => window?.open("https://docs.supportmail.dev", "_blank")}>
              <BookCheck />
              <span>Documentation</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => window?.open("https://help.supportmail.dev", "_blank")}>
              <LifeBuoy />
              <span>Support Server</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => window?.open("https://status.thelukez.com", "_blank")}>
              <ShieldUser />
              <span>Status Page</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => window?.open("https://legal.supportmail.dev", "_blank")}>
              <Section />
              <span>Legal Notice</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item variant="destructive" onclick={() => goto("/logout")}>
              <LogOut />
              <span>Logout</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>
</Sidebar.Root>

<Dialog.Root bind:open={snowflakeControlsOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Snowflake Intensity</Dialog.Title>
    </Dialog.Header>
    <Slider type="single" bind:value={snowflakes.intensity} min={0} max={10} step={1} />
  </Dialog.Content>
</Dialog.Root>
