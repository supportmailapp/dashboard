<script lang="ts">
  import { Button } from "$ui/button/index.js";
  import { BlacklistScope, type EntityType } from "supportmail-types";
  import { onMount } from "svelte";
  import FilterControls from "./FilterControls.svelte";
  import { page } from "$app/state";
  import equal from "fast-deep-equal/es6";
  import { toast } from "svelte-sonner";
  import apiClient from "$lib/utils/apiClient";
  import { APIRoutes } from "$lib/urls";
  import type { PaginatedBlacklistResponse } from "../../../api/v1/guilds/[guildid]/blacklist/+server";
  import { goto } from "$app/navigation";
  import * as Table from "$ui/table/index.js";

  let pageStatus = $state<"loading" | "loaded" | "error">("loading");
  const pageData = $state({
    page: 1 as number,
    perPage: 20 as number,
    total: null as number | null,
    totalPages: null as number | null,
    search: "" as string,
    scope: BlacklistScope.all as Exclude<BlacklistScope, BlacklistScope.global>,
    filterType: -1 as Exclude<EntityType, EntityType.guild> | -1,
  });
  /**
   * Used to determine whether it is allowed to fetch entries again.
   */
  let fetchedData = $state.snapshot(pageData);
  let entries = $state<PaginatedBlacklistResponse["data"]>([]);

  function buildSearchParams() {
    const params = new URLSearchParams();
    params.set("page", pageData.page.toString());
    params.set("count", pageData.perPage.toString());
    params.set("scope", pageData.scope.toString());

    if (pageData.search) {
      params.set("search", encodeURIComponent(pageData.search));
    }
    if (pageData.filterType !== -1) {
      params.set("type", pageData.filterType.toString());
    }
    return params;
  }

  function buildUrlWithParams() {
    const params = buildSearchParams();
    return `${page.url.origin}${page.url.pathname}?${params.toString()}`;
  }

  async function fetchBlacklist() {
    if (equal(fetchedData, $state.snapshot(pageData)) && pageStatus === "loaded") {
      toast.info("Nothing changed, not fetching blacklist again.");
      return;
    }

    try {
      const res = await apiClient.get<PaginatedBlacklistResponse>(APIRoutes.blacklist(page.data.guildId!), {
        searchParams: buildSearchParams(),
      });
      if (res.ok) {
        const data = await res.json();
        entries = data.data;
        pageData.total = data.pagination.totalItems;
        pageData.perPage = data.pagination.pageSize;
        pageData.page = data.pagination.page;
        pageData.totalPages = data.pagination.totalPages;
        fetchedData = $state.snapshot(pageData);
        pageStatus = "loaded";
        await goto(buildUrlWithParams(), { replaceState: true });
      } else {
        if (res.headers.get("Content-Type")?.includes("application/json")) {
          const errorData = await res.json();
          console.error("Error fetching entries:", errorData.error!);
        } else {
          console.error("Error fetching entries:", res.statusText);
        }
        pageStatus = "error";
      }
    } catch (error) {
      console.error("Error fetching blacklist:", error);
    }
  }

  onMount(() => {
    fetchBlacklist().then(() => {
      console.log("Blacklist fetched successfully.");
    });
  });
</script>

<div class="mb-4 flex flex-col items-start justify-start gap-3">
  <FilterControls
    filterType={pageData.filterType}
    scope={pageData.scope}
    perPage={pageData.perPage}
    search={pageData.search}
  />
  <Button variant="default" onclick={fetchBlacklist}>
    <span class="text-sm">Fetch</span>
  </Button>
</div>

<Table.Root>
  
</Table.Root>
