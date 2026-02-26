<script lang="ts">
  import { afterNavigate, goto } from "$app/navigation";
  import { page } from "$app/state";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import { APIRoutes } from "$lib/urls";
  import { safeParseInt } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import { Button } from "$ui/button";
  import * as Pagination from "$ui/pagination/index.js";
  import * as Empty from "$ui/empty/index.js";
  import equal from "fast-deep-equal/es6";
  import { TicketStatus } from "$lib/sm-types";
  import { toast } from "svelte-sonner";
  import type { PaginatedTicketsResponse } from "$v1Api/guilds/[guildid=snowflake]/tickets/+server";
  import FilterControls, { type TicketSearchScope } from "./FilterControls.svelte";
  import TicketsTable from "./TicketsTable.svelte";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { watch } from "runed";

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
    searchScope: (page.url.searchParams.get("sscope") || "all") as TicketSearchScope,
  });
  /**
   * Used to determine whether it is allowed to fetch tickets again.
   */
  let fetchedData = $state.snapshot(pageData);
  let ticketItems = $state<PaginatedTicketsResponse["data"]>([]);
  let ticketsStatus = $state<"loading" | "loaded" | "error">("loading");

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

  function buildSearchParams() {
    const params = new URLSearchParams();
    params.set("page", pageData.page.toString());
    params.set("count", pageData.perPage.toString());
    params.set("sscope", pageData.searchScope);
    if (pageData.status !== null) {
      params.set("status", stringifyStatus(pageData.status)); // For the api, this is the internal enum value
    }
    if (pageData.anonym) {
      params.set("anonym", "true");
    }
    if (pageData.search) {
      params.set("search", encodeURIComponent(pageData.search));
    }
    return params;
  }

  function buildUrlWithParams() {
    const params = buildSearchParams();
    return `${page.url.origin}${page.url.pathname}?${params.toString()}`;
  }

  async function fetchTickets(force = false) {
    if (equal(fetchedData, $state.snapshot(pageData)) && ticketsStatus === "loaded" && !force) {
      toast.info("Nothing changed, not fetching tickets again.");
      return;
    }

    try {
      ticketsStatus = "loading";

      const res = await apiClient.get<PaginatedTicketsResponse>(APIRoutes.tickets(page.params.guildid!), {
        searchParams: buildSearchParams(),
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

  afterNavigate(() => {
    // Reset pagination to page 1 when guild changes
    if (page.params.guildid) {
      pageData.page = safeParseInt(page.url.searchParams.get("page"), 1);
      pageData.perPage = safeParseInt(page.url.searchParams.get("count"), 20);
      pageData.status = page.url.searchParams.has("status")
        ? parseStatus(page.url.searchParams.get("status")!)
        : null;
      pageData.anonym = (page.url.searchParams.get("anonym") || "") === "true";
      pageData.search = page.url.searchParams.get("search") || "";
      pageData.searchScope = (page.url.searchParams.get("sscope") || "all") as TicketSearchScope;
      fetchTickets(true).then(() => {
        console.log("Tickets fetched successfully");
      });
    }
  });
</script>

<SiteHeading title="Tickets" />

<div class="mb-4 flex flex-col items-start justify-start gap-3">
  <FilterControls
    bind:status={() => stringifyStatus(pageData.status), (v) => (pageData.status = parseStatus(v))}
    bind:anonym={pageData.anonym}
    bind:search={pageData.search}
    bind:perPage={pageData.perPage}
    bind:searchScope={pageData.searchScope}
  />
  <Button variant="default" onclick={() => fetchTickets()}>
    <span class="text-sm">Fetch</span>
  </Button>
</div>

<div class="flex flex-col items-center">
  {#if ticketsStatus === "loading"}
    <LoadingSpinner class="mx-auto mt-10" />
  {:else if ticketsStatus === "error"}
    <div class="text-destructive">Failed to load tickets. Please try again later.</div>
  {:else if ticketsStatus === "loaded" && ticketItems.length === 0}
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon">
          <FolderOpen />
        </Empty.Media>
        <Empty.Title>{"No tickets found :("}</Empty.Title>
        <Empty.Description>
          Either your search/filter criteria did not match any tickets, or there are no tickets yet.
        </Empty.Description>
      </Empty.Header>
    </Empty.Root>
  {:else if ticketsStatus === "loaded" && ticketItems.length > 0}
    <TicketsTable items={ticketItems} />
  {/if}
</div>

{#if pageData.total && typeof pageData.totalPages === "number" && pageData.totalPages > 1}
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
