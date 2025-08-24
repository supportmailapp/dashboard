<script lang="ts">
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import Cog from "@lucide/svelte/icons/cog";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import Home from "@lucide/svelte/icons/home";
  import LogOut from "@lucide/svelte/icons/log-out";
  import MessagesSquare from "@lucide/svelte/icons/messages-square";
  import Moon from "@lucide/svelte/icons/moon";
  import ReceiptText from "@lucide/svelte/icons/receipt-text";
  import RotateCcw from "@lucide/svelte/icons/rotate-ccw";
  import Settings from "@lucide/svelte/icons/settings";
  import ShieldUser from "@lucide/svelte/icons/shield-user";
  import Star from "@lucide/svelte/icons/star";
  import Sun from "@lucide/svelte/icons/sun";
  import Table from "@lucide/svelte/icons/table";
  import Ticket from "@lucide/svelte/icons/ticket";

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
  import { mode, toggleMode } from "mode-watcher";
  import type { Component } from "svelte";
  import { toast } from "svelte-sonner";

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
      href: page.data.guildHref("/home"),
      icon: Home,
    },
    {
      id: "tickets",
      name: "Tickets",
      items: [
        {
          id: "view-tickets",
          name: "View Tickets",
          href: page.data.guildHref("/tickets"),
          icon: Ticket,
        },
        {
          id: "ticket-settings",
          name: "Ticket Settings",
          href: page.data.guildHref("/ticket-settings"),
          icon: Cog,
        },
        {
          id: "ticket-categories",
          name: "Ticket Categories",
          href: page.data.guildHref("/ticket-categories"),
          icon: FolderOpen,
        },
        {
          id: "feedback",
          name: "Feedback",
          href: page.data.guildHref("/feedback"),
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
          href: page.data.guildHref("/reports"),
          icon: Table,
        },
        {
          id: "report-settings",
          name: "Report Settings",
          href: page.data.guildHref("/report-settings"),
          icon: Cog,
        },
        {
          id: "blacklist",
          name: "Blacklist Management",
          href: page.data.guildHref("/blacklist"),
          icon: ShieldUser,
        },
      ],
    },
    {
      id: "content-management",
      name: "Content Management",
      items: [
        {
          id: "snippets",
          name: "Snippets",
          href: page.data.guildHref("/snippets"),
          icon: MessagesSquare,
        },
      ],
    },
  ];

  let reloadBtnDisabled = $state(false);
  let atMeHref = $derived(`/@me?back=${page.url.pathname}`);
  let isCurrentPage = $derived(page.data.isCurrentPage);

  async function reloadGuildData() {
    if (reloadBtnDisabled) return;
    reloadBtnDisabled = true;
    await page.data.guildsManager.loadChannels();
    await page.data.guildsManager.loadRoles();

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
                  <a href={item.href} {...props} onclick={onClick}>
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
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton isActive={isCurrentPage(subItem.href, true)}>
                    {#snippet child({ props })}
                      <a href={subItem.href} {...props} onclick={onClick}>
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
              <span>User Settings</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => goto("/billing")}>
              <ReceiptText />
              <span>Billing</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item closeOnSelect={false} onclick={() => toggleMode()}>
              {#if mode.current === "dark"}
                <Moon />
              {:else}
                <Sun />
              {/if}
              <span>Toggle Theme</span>
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
