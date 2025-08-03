<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import * as Pagination from "$lib/components/ui/pagination/index.js";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import { APIRoutes } from "$lib/urls";
  import { safeParseInt } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import { Button } from "$ui/button";
  import { Skeleton } from "$ui/skeleton";
  import Files from "@lucide/svelte/icons/files";
  import equal from "fast-deep-equal/es6";
  import { TicketStatus } from "supportmail-types";
  import { toast } from "svelte-sonner";
  import type { PaginatedTicketsResponse } from "../../../api/v1/guilds/[guildid]/tickets/+server";
  import FilterControls from "./FilterControls.svelte";
  import TicketsTable from "./TicketsTable.svelte";

  const pageData = $state({
    page: safeParseInt(page.url.searchParams.get("page"), 1),
    perPage: safeParseInt(page.url.searchParams.get("count"), 20),
    total: null as null | number,
    totalPages: null as null | number,
    status: (page.url.searchParams.has("status")
      ? parseStatus(page.url.searchParams.get("status")!)
      : null) as TicketStatus | null,
    anonym: (page.url.searchParams.get("anonym") || "") === "true",
    search: page.url.searchParams.get("search") || "",
  });
  /**
   * Used to determine whether it is allowed to fetch tickets again.
   */
  let fetchedData = $state.snapshot(pageData);
  let ticketItems = $state<PaginatedTicketsResponse["data"]>([]);
  let ticketsStatus = $state<"loading" | "loaded" | "error">("loading");

  async function fetchTickets() {
    if (equal(fetchedData, $state.snapshot(pageData)) && ticketsStatus === "loaded") {
      toast.info("Nothing changed, not fetching tickets again.");
      return;
    }

    try {
      ticketsStatus = "loading";
      const searchParams = buildSearchParams(true);

      const res = await apiClient.get<PaginatedTicketsResponse>(APIRoutes.tickets(page.data.guildId!), {
        searchParams,
      });

      if (res.ok) {
        const data = await res.json();
        ticketItems = data.data;
        pageData.total = data.pagination.totalItems;
        pageData.perPage = data.pagination.pageSize;
        pageData.page = data.pagination.page;
        pageData.totalPages = data.pagination.totalPages;
        fetchedData = $state.snapshot(pageData);
        ticketsStatus = "loaded";
        await goto(buildUrlWithParams(false), { replaceState: true });
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

  function stringifyStatus(status: TicketStatus | null) {
    switch (status) {
      case TicketStatus.open:
        return "open";
      case TicketStatus.closed:
        return "closed";
      case TicketStatus.closeRequested:
        return "closeRequested";
      default:
        return "all"; // Default to "all" if unknown
    }
  }

  function parseStatus(status: string): TicketStatus | null {
    console.log("Parsing status:", status);
    switch (status) {
      case "open":
        return TicketStatus.open;
      case "closed":
        return TicketStatus.closed;
      case "closeRequested":
        return TicketStatus.closeRequested;
      default:
        return null; // Default to null (all) if unknown
    }
  }

  function buildSearchParams(raw = true) {
    const params = new URLSearchParams();
    params.set("page", pageData.page.toString());
    params.set("count", pageData.perPage.toString());
    if (pageData.status !== null) {
      params.set("status", raw ? pageData.status.toString() : stringifyStatus(pageData.status)); // For the api, this is the internal enum value
    }
    if (pageData.anonym) {
      params.set("anonym", "true");
    }
    if (pageData.search) {
      params.set("search", encodeURIComponent(pageData.search));
    }
    return params;
  }

  function buildUrlWithParams(raw = true) {
    const params = buildSearchParams(raw);
    return `${page.url.origin}${page.url.pathname}?${params.toString()}`;
  }
</script>

<SiteHeading title="Tickets" />

<!-- pageData Controls -->

<div class="mb-4 flex flex-col items-start justify-start gap-3">
  <FilterControls
    bind:status={() => stringifyStatus(pageData.status), (v) => (pageData.status = parseStatus(v))}
    bind:anonym={pageData.anonym}
    bind:search={pageData.search}
    bind:perPage={pageData.perPage}
  />
  <div class="grid grid-cols-2 gap-2">
    <Button variant="default" onclick={fetchTickets}>
      <span class="text-sm">Fetch</span>
    </Button>
    <Tooltip.Provider delayDuration={100}>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="outline"
              size="icon"
              onclick={() => {
                navigator.clipboard.writeText(buildUrlWithParams(false));
                toast.success("Link copied to clipboard!");
              }}
            >
              <Files class="size-4" />
            </Button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p>Copy link</p>
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  </div>
</div>

<div class="flex flex-col items-center">
  {#if ticketsStatus === "loading"}
    <Skeleton class="mx-auto h-8 w-full max-w-2xl" />
  {:else if ticketsStatus === "error"}
    <div class="text-destructive">Failed to load tickets. Please try again later.</div>
  {:else if ticketsStatus === "loaded" && ticketItems.length === 0}
    <div class="text-muted-foreground">No tickets found :(</div>
  {:else if ticketsStatus === "loaded" && ticketItems.length > 0}
    <TicketsTable items={ticketItems} />
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
