<script lang="ts">
  import Check from "@lucide/svelte/icons/check";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ChevronsLeft from "@lucide/svelte/icons/chevrons-left";
  import ChevronsRight from "@lucide/svelte/icons/chevrons-right";
  import Plus from "@lucide/svelte/icons/plus";

  import { BlacklistScope, EntityType } from "$lib/sm-types";
  import equal from "fast-deep-equal/es6";
  import { toast } from "svelte-sonner";

  import {
    type APIBlacklistEntry,
    type PaginatedBlacklistResponse,
  } from "../../../api/v1/guilds/[guildid]/blacklist/+server";
  import EntriesTable from "./EntriesTable.svelte";
  import FilterControls from "./FilterControls.svelte";
  import { BLEntry, dialogFields } from "./entry.svelte";

  import { afterNavigate, goto } from "$app/navigation";
  import { page } from "$app/state";

  import { Button, buttonVariants } from "$ui/button/index.js";
  import * as Dialog from "$ui/dialog/index.js";
  import * as Select from "$ui/select/index.js";
  import Input from "$ui/input/input.svelte";
  import Label from "$ui/label/label.svelte";
  import * as Popover from "$ui/popover";

  import AreYouSureDialog from "$lib/components/AreYouSureDialog.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import Mention from "$lib/components/discord/Mention.svelte";
  import { APIRoutes } from "$lib/urls";
  import { cn, safeParseInt } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import { SvelteBitfield } from "$lib/utils/reactiveBitfield.svelte.js";
  import { AlertDialogTrigger } from "$ui/alert-dialog";
  import { getManager } from "$lib/stores/GuildsManager.svelte";
  import MentionableSelect from "$lib/components/discord/MentionableSelect.svelte";
  import { SvelteSet } from "svelte/reactivity";
  import Trash from "@lucide/svelte/icons/trash";

  const guildsManager = getManager();
  const roles = guildsManager.roles;
  let pageStatus = $state<"loading" | "loaded" | "error">("loading");
  const pageData = $state({
    page: 1 as number,
    perPage: 20 as number,
    total: null as number | null,
    totalPages: null as number | null,
    search: "" as string,
    scopes: new SvelteBitfield(
      BlacklistScope.tickets | BlacklistScope.reports | BlacklistScope.tags,
    ) as SvelteBitfield,
    filterType: -1 as Exclude<EntityType, EntityType.guild> | -1,
    sorting: "newestFirst" as "newestFirst" | "oldestFirst",
  });
  /**
   * Used to determine whether it is allowed to fetch entries again.
   */
  let fetchedData = $state($state.snapshot(pageData) as typeof pageData);
  let entries = $state<PaginatedBlacklistResponse["data"]>([]);
  let rowSelection = new SvelteSet<string>();

  const selectedText = $derived(rowSelection.size === 1 ? "1 entry" : `${rowSelection.size} entries`);
  let bulkDeleteConfirmation = $state(false);

  const newEntry = new BLEntry();

  $inspect("new entry scopes", newEntry.scopes.bits.toString());

  function buildSearchParams() {
    const params = new URLSearchParams();
    params.set("page", pageData.page.toString());
    params.set("count", pageData.perPage.toString());
    params.set("scopes", pageData.scopes.bits.toString());

    if (pageData.search) {
      params.set("search", encodeURIComponent(pageData.search));
    }
    if (pageData.filterType !== -1) {
      params.set("type", pageData.filterType.toString());
    }
    if (pageData.sorting === "oldestFirst") {
      params.set("sort", "oldest"); // Default is newest first, so we only need to provide it when otherwise
    }
    return params;
  }

  function buildUrlWithParams() {
    const params = buildSearchParams();
    return `${page.url.origin}${page.url.pathname}?${params.toString()}`;
  }

  function pageDataIsDirty(): boolean {
    const { scopes, ...rest1 } = $state.snapshot(pageData);
    const { scopes: _scopes, ...rest2 } = $state.snapshot(fetchedData);
    return !equal(rest1, rest2) || !equal(scopes, _scopes);
  }

  async function fetchBlacklist() {
    if (!pageDataIsDirty() && pageStatus === "loaded") {
      toast.info("Nothing changed, not fetching blacklist again.");
      return;
    }

    try {
      const res = await apiClient.get<PaginatedBlacklistResponse>(APIRoutes.blacklist(page.params.guildid!), {
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

  afterNavigate(() => {
    fetchBlacklist().then(() => {
      console.log("Blacklist fetched successfully.");
    });
  });

  async function addEntry() {
    if (!newEntry.id || newEntry.scopes.size === 0) {
      toast.error("Invalid entry", {
        description: "Please select a user/role and at least one scope.",
      });
      return;
    }

    newEntry.loading = true;
    await saveEntry(newEntry);
    newEntry.clear();
  }

  async function saveEntry(entry: BLEntry, action: "edit" | "add" = "add") {
    try {
      if (entry.scopes.size === 0) {
        toast.error("At least one scope is required.");
        return;
      }

      const res = await apiClient.put(APIRoutes.blacklist(page.params.guildid!), {
        json: {
          id: entry.id,
          guildId: page.params.guildid!,
          scopes: entry.scopes.toString(),
          _type: entry.type,
        },
      });

      if (!res.ok) {
        const errorData = await res.json<any>();
        throw new Error(errorData.message || "Unknown error");
      }

      const data = await res.json<APIBlacklistEntry>();
      if (action === "add") {
        entries = [...entries, data];
      } else {
        entries = entries.map((e) => (e._id === data._id ? data : e));
      }
      toast.success("Entry saved!");
    } catch (err: any) {
      console.error("Error saving entry:", err);
      toast.error("Error saving entry", {
        description: err.message,
      });
    }
  }

  async function deleteEntries(id?: string) {
    const ids = id ? [id] : Array.from(rowSelection.values());
    const singleEntry = ids.length === 1;
    try {
      const res = await apiClient.delete(APIRoutes.blacklist(page.params.guildid!), {
        json: {
          ids: ids,
        },
      });
      if (!res.ok) {
        const errorData = await res.json<any>();
        throw new Error(errorData.message || "Unknown error");
      }

      entries = entries.filter((entry) => !ids.includes(entry._id));
      toast.success(`${singleEntry ? "Entry" : "Entries"} deleted!`);
      if (!id) rowSelection.clear();
      else rowSelection.delete(id);
    } catch (err: any) {
      toast.error("Error deleting entries", {
        description: err.message,
      });
    } finally {
      bulkDeleteConfirmation = false;
    }
  }
</script>

<SiteHeading title="Blacklist" />

<div class="mb-4 flex w-full max-w-3xl flex-col items-start justify-start gap-3">
  <FilterControls
    bind:filterType={pageData.filterType}
    bind:scopes={pageData.scopes}
    bind:perPage={pageData.perPage}
    bind:search={pageData.search}
    bind:sorting={pageData.sorting}
  />
  <div class="flex w-full flex-row items-center gap-2">
    <Button variant="default" onclick={fetchBlacklist}>
      <span class="text-sm">Fetch</span>
    </Button>
    <Dialog.Root bind:open={newEntry.dialogOpen}>
      <Dialog.Trigger class={buttonVariants({ variant: "outline" })}>
        <Plus class="size-5" />
        Add Entry
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Add Entry</Dialog.Title>
        </Dialog.Header>
        <div class="grid grid-cols-[1fr_4fr] gap-4">
          <Label>New Entry</Label>
          <Popover.Root
            bind:open={() => newEntry.canOpenPopup && newEntry.popupOpen, (v) => (newEntry.popupOpen = v)}
          >
            <Popover.Trigger
              class={cn(newEntry.canOpenPopup && buttonVariants({ variant: "outline" }), "w-60")}
              disabled={pageStatus === "loading"}
            >
              {#if newEntry.id !== ""}
                {@const isUser = newEntry.type === EntityType.user}
                <Mention
                  userId={isUser ? newEntry.id : undefined}
                  roleId={!isUser ? newEntry.id : undefined}
                  onDelete={() => {
                    newEntry.clear();
                    return true;
                  }}
                />
              {:else}
                Select User / Role
              {/if}
            </Popover.Trigger>
            <Popover.Content customAnchor={newEntry.customAnchor}>
              <MentionableSelect
                excludedRoleIds={newEntry.type === EntityType.role ? [newEntry.id] : []}
                excludedUserIds={newEntry.type === EntityType.user ? [newEntry.id] : []}
                onRoleSelect={(roleId) => {
                  const newRole = roles.get(roleId);
                  if (newRole) {
                    newEntry.setRole(newRole);
                  }
                }}
                onUserSelect={(user) => newEntry.setUser(user)}
              />
            </Popover.Content>
          </Popover.Root>

          <Label>Scopes</Label>
          <Select.Root
            type="multiple"
            bind:value={
              () => newEntry.scopes.getSetBits().map((bit) => String(1 << bit)),
              (newVals) => {
                const newNums = newVals.map((v) => parseInt(v, 10));
                newEntry.scopes.clear();
                newEntry.scopes.set(...newNums);
              }
            }
          >
            <Select.Trigger class="w-60">
              {#if newEntry.scopes.size === 0}
                Select Scopes
              {:else}
                <span
                  >{newEntry.scopes
                    .getSetBits()
                    .map((bit) => dialogFields.scopes.find((s) => s.value === 1 << bit)?.label ?? "Unknown")
                    .join(", ")}</span
                >
              {/if}
            </Select.Trigger>
            <Select.Content class="w-60">
              <Select.Group>
                {#each dialogFields.scopes as _scope}
                  <Select.Item value={String(_scope.value)}>
                    {#if newEntry.scopes.has(_scope.value)}
                      <span class="absolute right-2 flex size-3.5 items-center justify-center">
                        <Check class="size-4" />
                      </span>
                    {/if}
                    {_scope.label}
                  </Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>
        <Dialog.Footer>
          <Button
            type="submit"
            onclick={addEntry}
            showLoading={newEntry.loading}
            disabled={!newEntry.id || newEntry.scopes.size === 0 || newEntry.loading}>Save</Button
          >
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
    <AreYouSureDialog
      title="Do you really want to delete {selectedText}?"
      description="This action cannot be undone."
      onYes={() => {
        deleteEntries();
      }}
      bind:open={bulkDeleteConfirmation}
    >
      {#snippet child()}
        <AlertDialogTrigger
          class={cn(buttonVariants({ variant: !rowSelection.size ? "outline" : "destructive" }), "ml-auto")}
          disabled={rowSelection.size === 0}
        >
          <Trash class="size-5" />
          {#if !!rowSelection.size}
            Delete {rowSelection.size}
          {:else}
            Delete
          {/if}
        </AlertDialogTrigger>
      {/snippet}
    </AreYouSureDialog>
  </div>
</div>

<EntriesTable
  bind:pageStatus
  selectedRows={Array.from(rowSelection.values())}
  {entries}
  saveEntry={(e) => saveEntry(e, "edit")}
  deleteEntry={(_id) => deleteEntries(_id)}
  toggleSelectedRow={(_id, selected) => {
    if (selected) {
      rowSelection.add(_id);
    } else {
      rowSelection.delete(_id);
    }
  }}
/>

{#if pageStatus === "loaded" && entries.length > 0}
  <div class="space-y-3 py-3">
    {#if (fetchedData.totalPages ?? 1) > pageData.page}
      <div class="flex w-full flex-row justify-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onclick={async () => {
            if (pageData.page > 1) {
              pageData.page = 1;
              await fetchBlacklist();
            }
          }}
          disabled={fetchedData.page < 2}
        >
          <ChevronsLeft class="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onclick={async () => {
            if (pageData.page > 1) {
              pageData.page--;
              await fetchBlacklist();
            }
          }}
          disabled={fetchedData.page < 2}
        >
          <ChevronLeft class="size-4" />
        </Button>
        <Input
          type="text"
          minlength={1}
          maxlength={5}
          bind:value={
            () => pageData.page.toString(),
            (v) => {
              pageData.page = safeParseInt(v, 1);
              if (v === "") {
                toast.warning("Page number cannot be empty!");
              } else if (pageData.page.toString() !== v) {
                toast.warning("Invalid page number");
              }
            }
          }
          class="w-18 text-center"
        />
        <Button
          variant="outline"
          size="icon"
          onclick={async () => {
            if (pageData.page < (pageData.totalPages ?? 1)) {
              pageData.page++;
              await fetchBlacklist();
            }
          }}
          disabled={fetchedData.page >= (fetchedData.totalPages ?? 1)}
        >
          <ChevronRight class="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onclick={async () => {
            if (pageData.page < (pageData.totalPages ?? 1)) {
              pageData.page = pageData.totalPages!;
              await fetchBlacklist();
            }
          }}
          disabled={fetchedData.page >= (fetchedData.totalPages ?? 1)}
        >
          <ChevronsRight class="size-4" />
        </Button>
      </div>
    {/if}

    <p class="text-muted-foreground text-center text-sm select-none">
      Page {fetchedData.page} of {fetchedData.totalPages ?? 1}
    </p>
  </div>
{/if}
