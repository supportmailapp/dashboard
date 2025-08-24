<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import { APIRoutes } from "$lib/urls";
  import { safeParseInt } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import { Button } from "$ui/button";
  import * as Pagination from "$ui/pagination/index.js";
  import { Skeleton } from "$ui/skeleton";
  import * as Tooltip from "$ui/tooltip/index.js";
  import Files from "@lucide/svelte/icons/files";
  import equal from "fast-deep-equal/es6";
  import { ReportStatus } from "supportmail-types";
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import type { PaginatedReportsResponse } from "../../../api/v1/guilds/[guildid]/reports/+server";
  import FilterControls, { type ReportSearchScope, type ReportSearchType } from "./FilterControls.svelte";
  import ReportsTable from "./ReportsTable.svelte";

  const pageData = $state({
    page: safeParseInt(page.url.searchParams.get("page"), 1),
    perPage: safeParseInt(page.url.searchParams.get("count"), 20),
    total: null as null | number,
    totalPages: null as null | number,
    status: (page.url.searchParams.has("status")
      ? parseStatus(page.url.searchParams.get("status")!)
      : null) as ReportStatus | null,
    search: page.url.searchParams.get("search") || "",
    searchScope: (page.url.searchParams.get("sscope") || "all") as ReportSearchScope,
    reportType: (page.url.searchParams.get("type") || "all") as ReportSearchType,
  });
  /**
   * Used to determine whether it is allowed to fetch reports again.
   */
  let fetchedData = $state.snapshot(pageData);
  let reportItems = $state<PaginatedReportsResponse["data"]>([]);
  let reportsStatus = $state<"loading" | "loaded" | "error">("loading");

  async function fetchReports() {
    if (equal(fetchedData, $state.snapshot(pageData)) && reportsStatus === "loaded") {
      toast.info("Nothing changed, not fetching reports again.");
      return;
    }

    try {
      reportsStatus = "loading";
      const searchParams = buildSearchParams(true);

      const res = await apiClient.get<PaginatedReportsResponse>(APIRoutes.reports(page.data.guildId!), {
        searchParams,
      });

      if (res.ok) {
        const data = await res.json();
        reportItems = data.data;
        pageData.total = data.pagination.totalItems;
        pageData.perPage = data.pagination.pageSize;
        pageData.page = data.pagination.page;
        pageData.totalPages = data.pagination.totalPages;
        fetchedData = $state.snapshot(pageData);
        reportsStatus = "loaded";
        await goto(buildUrlWithParams(false), { replaceState: true });
      } else {
        if (res.headers.get("Content-Type")?.includes("application/json")) {
          const errorData = await res.json();
          console.error("Error fetching reports:", errorData.error!);
        } else {
          console.error("Error fetching reports:", res.statusText);
        }
        reportsStatus = "error";
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      return;
    }
  }

  function stringifyStatus(status: ReportStatus | null): StringifiedReportStatus | "all" {
    switch (status) {
      case ReportStatus.open:
        return "open";
      case ReportStatus.ignored:
        return "ignored";
      case ReportStatus.timeouted:
        return "timeouted";
      case ReportStatus.kicked:
        return "kicked";
      case ReportStatus.banned:
        return "banned";
      case ReportStatus.messageDeleted:
        return "messageDeleted";
      default:
        return "all"; // Default to "all" if unknown
    }
  }

  function parseStatus(status: string): ReportStatus | null {
    console.log("Parsing status:", status);
    switch (status as StringifiedReportStatus) {
      case "open":
        return ReportStatus.open;
      case "ignored":
        return ReportStatus.ignored;
      case "timeouted":
        return ReportStatus.timeouted;
      case "kicked":
        return ReportStatus.kicked;
      case "banned":
        return ReportStatus.banned;
      case "messageDeleted":
        return ReportStatus.messageDeleted;
      case "resolved":
        return ReportStatus.resolved;
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
    if (pageData.search) {
      params.set("search", encodeURIComponent(pageData.search));
    }
    if (pageData.reportType !== "all") {
      params.set("type", pageData.reportType);
    }
    if (pageData.searchScope !== "all") {
      params.set("sscope", pageData.searchScope);
    }
    return params;
  }

  function buildUrlWithParams(raw = true) {
    const params = buildSearchParams(raw);
    return `${page.url.origin}${page.url.pathname}?${params.toString()}`;
  }

  onMount(() => {
    // Fetch reports when the component mounts
    fetchReports().then(() => {
      console.log("Reports fetched successfully");
    });
  });
</script>

<SiteHeading title="Reports" />

<div class="mb-4 flex flex-col items-start justify-start gap-3">
  <FilterControls
    bind:status={() => stringifyStatus(pageData.status), (v) => (pageData.status = parseStatus(v))}
    bind:search={pageData.search}
    bind:perPage={pageData.perPage}
    bind:searchScope={pageData.searchScope}
    bind:reportType={pageData.reportType}
  />
  <div class="grid grid-cols-2 gap-2">
    <Button variant="default" onclick={fetchReports}>
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
  {#if reportsStatus === "loading"}
    <Skeleton class="h-8 w-full max-w-2xl" />
  {:else if reportsStatus === "error"}
    <div class="text-destructive">Failed to load reports. Please try again later.</div>
  {:else if reportsStatus === "loaded" && reportItems.length === 0}
    <div class="text-muted-foreground">{"No reports found :("}</div>
  {:else if reportsStatus === "loaded" && reportItems.length > 0}
    <ReportsTable items={reportItems} />
  {/if}
</div>

{#if pageData.total && typeof pageData.totalPages === "number" && pageData.totalPages > 1}
  <Pagination.Root
    page={pageData.page}
    count={pageData.total}
    perPage={pageData.perPage}
    onPageChange={(pageNum) => {
      pageData.page = pageNum;
      fetchReports();
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
