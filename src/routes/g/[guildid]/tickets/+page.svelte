<script lang="ts">
  import { page } from "$app/state";
  import * as Pagination from "$lib/components/ui/pagination/index.js";
  import { APIRoutes } from "$lib/urls";
  import { safeParseInt } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import { Skeleton } from "$ui/skeleton";
  import type { PaginatedTicketsResponse } from "../../../api/v1/guilds/[guildid]/tickets/+server";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import * as Select from "$ui/select";
  import { Button } from "$ui/button";
  import { toast } from "svelte-sonner";

  const pageData = $state({
    page: safeParseInt(page.url.searchParams.get("page"), 1),
    perPage: safeParseInt(page.url.searchParams.get("count"), 20),
    total: null as null | number,
    totalPages: null as null | number,
  });
  /**
   * Used to determine whether it is allowed to fetch tickets again.
   */
  let fetchedPerPage = $state(pageData.perPage);
  let ticketItems = $state<PaginatedTicketsResponse["data"]>([]);
  let ticketsStatus = $state<"loading" | "loaded" | "error">("loading");

  async function fetchTickets() {
    if (fetchedPerPage === pageData.perPage && ticketsStatus === "loaded") {
      toast.info("Nothing changed, not fetching tickets again.");
      return;
    }

    try {
      ticketsStatus = "loading";
      const res = await apiClient.get<PaginatedTicketsResponse>(APIRoutes.tickets(page.data.guildId!), {
        searchParams: {
          page: pageData.page,
          count: pageData.perPage,
        },
      });

      if (res.ok) {
        const data = await res.json();
        ticketItems = data.data;
        pageData.total = data.pagination.totalItems;
        pageData.perPage = data.pagination.pageSize;
        pageData.page = data.pagination.page;
        pageData.totalPages = data.pagination.totalPages;
        fetchedPerPage = data.pagination.pageSize;
        ticketsStatus = "loaded";
      } else {
        if (res.headers.get("Content-Type")?.includes("application/json")) {
          const errorData = await res.json();
          console.error("Error fetching tickets:", errorData.error!);
        } else {
          console.error("Error fetching tickets:", res.statusText);
        }
        ticketsStatus = "error";
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      return;
    }
  }

  let mounted = $state(false);
  $effect(() => {
    if (!mounted) {
      mounted = true;
      fetchTickets().then(() => {
        console.log("Tickets fetched successfully");
      });
    }
  });
</script>

<SiteHeading title="Tickets" />

<!-- pageData Controls -->
<div class="mb-4 flex items-center justify-start gap-3">
  <div class="flex items-center space-x-2">
    <label for="perPage" class="text-muted-foreground text-sm">Tickets per page:</label>
    <Select.Root
      type="single"
      bind:value={() => pageData.perPage.toString(), (v) => (pageData.perPage = parseInt(v, 10))}
    >
      <Select.Trigger class="w-20">{pageData.perPage.toString()}</Select.Trigger>
      <Select.Content>
        <Select.Item value="20">20</Select.Item>
        <Select.Item value="50">50</Select.Item>
        <Select.Item value="100">100</Select.Item>
      </Select.Content>
    </Select.Root>
  </div>
  <Button variant="default" onclick={fetchTickets}>
    <span class="text-sm">Fetch</span>
  </Button>
</div>

<div class="flex flex-col items-center">
  {#if ticketsStatus === "loading"}
    <Skeleton class="mx-auto h-8 w-full max-w-2xl" />
  {:else if ticketsStatus === "error"}
    <div class="text-destructive">Failed to load tickets. Please try again later.</div>
  {:else if ticketsStatus === "loaded" && ticketItems.length === 0}
    <div class="text-muted-foreground">No tickets found :(</div>
  {:else if ticketsStatus === "loaded" && ticketItems.length > 0}
    <ul class="w-full max-w-2xl">
      {#each ticketItems as ticket (ticket.id)}
        <li>{ticket.id}</li>
      {/each}
    </ul>
  {/if}
</div>

{#if pageData.total === null}
  <Skeleton class="mx-auto h-8 w-full max-w-2xl" />
{:else if typeof pageData.totalPages === "number" && pageData.totalPages > 1}
  <Pagination.Root
    page={pageData.page}
    count={pageData.total}
    perPage={pageData.perPage}
    onPageChange={(pageNum) => {
      pageData.page = pageNum;
      fetchTickets();
    }}
  >
    {#snippet children({ pages, currentPage })}
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.PrevButton />
        </Pagination.Item>
        {#each pages as page (page.key)}
          {#if page.type === "ellipsis"}
            <Pagination.Item>
              <Pagination.Ellipsis />
            </Pagination.Item>
          {:else}
            <Pagination.Item>
              <Pagination.Link {page} isActive={currentPage === page.value}>
                {page.value}
              </Pagination.Link>
            </Pagination.Item>
          {/if}
        {/each}
        <Pagination.Item>
          <Pagination.NextButton />
        </Pagination.Item>
      </Pagination.Content>
    {/snippet}
  </Pagination.Root>
{/if}
