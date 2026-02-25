<script lang="ts">
  import ShieldBan from "@lucide/svelte/icons/shield-ban";
  import { page } from "$app/state";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { isCurrentPage } from "$lib/stores/site.svelte";
  import Button from "$ui/button/button.svelte";
  import type { ComponentProps } from "svelte";

  let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

  const data = {
    navMain: [
      {
        title: "Users",
        href: "/users",
      },
    ],
  };
</script>

<Sidebar.Root variant="floating" {...restProps}>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg">
          {#snippet child({ props })}
            <div class="flex items-center">
              <a
                href="/"
                class="flex items-center gap-2 transition-opacity duration-150 hover:opacity-70"
                {...props}
              >
                <Avatar.Root class="aspect-square size-8">
                  <Avatar.Image src="/logo.png" alt="Logo" />
                  <Avatar.Fallback>SM</Avatar.Fallback>
                </Avatar.Root>
                <div class="flex flex-col gap-0 -space-y-1 leading-tight">
                  <span class="text-lg font-bold">SupportMail</span>
                  <span class="text-muted-foreground text-sm">Admin Dashboard</span>
                </div>
              </a>
            </div>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.Menu class="gap-2">
        <Sidebar.MenuItem>
          <Sidebar.MenuButton isActive={"/admin" === page.url.pathname}>
            {#snippet child({ props })}
              <a href="/admin" class="font-medium" {...props}>Home (Admin)</a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
        {#each data.navMain as item (item.title)}
          <Sidebar.MenuItem>
            <Sidebar.MenuButton isActive={isCurrentPage("/admin" + item.href, true)}>
              {#snippet child({ props })}
                <a href={"/admin" + item.href} class="font-medium" {...props}>
                  {item.title}
                </a>
              {/snippet}
            </Sidebar.MenuButton>
          </Sidebar.MenuItem>
        {/each}
      </Sidebar.Menu>
    </Sidebar.Group>
  </Sidebar.Content>
  <Sidebar.Footer>
    <Button variant="link" href="/mod" class="w-full">
      <ShieldBan />
      Moderator Dash
    </Button>
  </Sidebar.Footer>
</Sidebar.Root>
