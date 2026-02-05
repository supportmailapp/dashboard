<script lang="ts">
  import { page } from "$app/state";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { isCurrentPage } from "$lib/stores/site.svelte";
  import type { ComponentProps } from "svelte";

  let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

  const data = {
    navMain: [
      {
        title: "Reports",
        href: "/reports",
      },
      {
        title: "Config",
        href: "/config",
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
                  <span class="text-muted-foreground text-sm">Moderator Dashboard</span>
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
          <Sidebar.MenuButton isActive={"/mod" === page.url.pathname}>
            {#snippet child({ props })}
              <a href="/mod" class="font-medium" {...props}>Home (Mod)</a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
        {#each data.navMain as item (item.title)}
          <Sidebar.MenuItem>
            <Sidebar.MenuButton isActive={isCurrentPage("/mod" + item.href, true)}>
              {#snippet child({ props })}
                <a href={"/mod" + item.href} class="font-medium" {...props}>
                  {item.title}
                </a>
              {/snippet}
            </Sidebar.MenuButton>
            <!-- {#if item.items?.length}
              <Sidebar.MenuSub class="ms-0 border-s-0 px-1.5">
                {#each item.items as subItem (subItem.title)}
                  <Sidebar.MenuSubItem>
                    <Sidebar.MenuSubButton isActive={subItem.isActive}>
                      {#snippet child({ props })}
                        <a href={subItem.href} {...props}>{subItem.title}</a>
                      {/snippet}
                    </Sidebar.MenuSubButton>
                  </Sidebar.MenuSubItem>
                {/each}
              </Sidebar.MenuSub>
            {/if} -->
          </Sidebar.MenuItem>
        {/each}
      </Sidebar.Menu>
    </Sidebar.Group>
  </Sidebar.Content>
</Sidebar.Root>
