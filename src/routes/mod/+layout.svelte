<script lang="ts">
  import ModSidebar from "$lib/components/mod-sidebar.svelte";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { createBreadcrumbs } from "./breadcrumb.svelte";

  const crumbs = createBreadcrumbs();

  let { children } = $props();
</script>

<Sidebar.Provider style="--sidebar-width: 19rem;">
  <ModSidebar />
  <Sidebar.Inset>
    <header class="flex h-16 shrink-0 items-center gap-2 px-4">
      <Sidebar.Trigger class="-ms-1" />
      <Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item class="hidden md:block">
            <Breadcrumb.Link href="/mod">Moderation</Breadcrumb.Link>
          </Breadcrumb.Item>
          {#if crumbs.crumbs.length > 0}
            {#each crumbs.crumbs as crumb}
              <Breadcrumb.Separator class="hidden md:block" />
              <Breadcrumb.Item>
                {#if typeof crumb === "string"}
                  <Breadcrumb.Page>{crumb}</Breadcrumb.Page>
                {:else}
                  <Breadcrumb.Link href={`/mod${crumb.href}`.replace(/\/$/, "")}>
                    {crumb.label}
                  </Breadcrumb.Link>
                {/if}
              </Breadcrumb.Item>
            {/each}
          {/if}
        </Breadcrumb.List>
      </Breadcrumb.Root>
    </header>
    <div class="flex flex-1 flex-col gap-4 p-3 pt-0">
      <div class="bg-muted/50 min-h-screen flex-1 rounded-xl p-3 md:min-h-min">
        {@render children?.()}
      </div>
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
