<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import { APIRoutes } from "$lib/urls";
  import { cn } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import { SvelteBitfield } from "$lib/utils/reactiveBitfield.svelte.js";
  import { Button, buttonVariants } from "$ui/button/index.js";
  import * as Dialog from "$ui/dialog/index.js";
  import * as Dropdown from "$ui/dropdown-menu/index.js";
  import Label from "$ui/label/label.svelte";
  import * as Select from "$ui/select/index.js";
  import Check from "@lucide/svelte/icons/check";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import Plus from "@lucide/svelte/icons/plus";
  import equal from "fast-deep-equal/es6";
  import { BlacklistScope, EntityType } from "supportmail-types";
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import type { PaginatedBlacklistResponse } from "../../../api/v1/guilds/[guildid]/blacklist/+server";
  import EntriesTable from "./EntriesTable.svelte";
  import FilterControls from "./FilterControls.svelte";
  import * as Popover from "$ui/popover";
  import Mention from "$lib/components/discord/Mention.svelte";
  import MentionableSelect from "$lib/components/MentionableSelect.svelte";
  import type { APIUser } from "discord-api-types/v10";

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

  // Map BlacklistScope enum values to bit positions
  const scopeToBit = {
    [BlacklistScope.all]: 1, // bit 0: 2^0 = 1
    [BlacklistScope.tickets]: 2, // bit 1: 2^1 = 2
    [BlacklistScope.reports]: 4, // bit 2: 2^2 = 4
    [BlacklistScope.tags]: 8, // bit 3: 2^3 = 8
  };

  const addDialog = {
    types: [
      { label: "User", value: EntityType.user },
      { label: "Role", value: EntityType.role },
    ],
    scopes: [
      { label: "All", value: BlacklistScope.all },
      { label: "Tickets", value: BlacklistScope.tickets },
      { label: "Reports", value: BlacklistScope.reports },
      { label: "Tags", value: BlacklistScope.tags },
    ],
  } as const;
  class NewEntry {
    id = $state("");
    type = $state<Exclude<EntityType, EntityType.guild>>(EntityType.user);
    scopes = new SvelteBitfield(scopeToBit[BlacklistScope.all]);
    popupOpen = $state(false);
    customAnchor = $state<HTMLElement | null>(null);

    setRole(role: GuildRole) {
      this.id = role.id;
      this.type = EntityType.role;
      this.popupOpen = false;
    }

    setUser(user: APIUser) {
      this.id = user.id;
      this.type = EntityType.user;
      this.popupOpen = false;
    }

    clear() {
      this.id = "";
      this.type = EntityType.user;
      this.scopes.clear();
      this.popupOpen = false;
    }
  }
  const newEntry = new NewEntry();

  $inspect("new entry", {
    id: newEntry.id,
    type: newEntry.type,
    scopes: newEntry.scopes.toBinary(),
  });

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

  function toggleScope(scopeValue: Exclude<BlacklistScope, BlacklistScope.global>) {
    const bitValue = scopeToBit[scopeValue];

    // Check if this is the only bit set and we're trying to unset it
    if (newEntry.scopes.has(bitValue) && newEntry.scopes.popCount() === 1) {
      toast.error("You cannot do that!", {
        description: "At least one scope is required.",
      });
      return;
    }

    newEntry.scopes.toggle(bitValue);
  }
</script>

<SiteHeading title="Blacklist" />

<div class="mb-4 flex flex-col items-start justify-start gap-3">
  <FilterControls
    filterType={pageData.filterType}
    scope={pageData.scope}
    perPage={pageData.perPage}
    search={pageData.search}
  />
  <div class="flex flex-row items-center gap-2">
    <Button variant="default" onclick={fetchBlacklist}>
      <span class="text-sm">Fetch</span>
    </Button>
    <Dialog.Root>
      <Dialog.Trigger class={buttonVariants({ variant: "secondary", size: "icon" })}>
        <Plus class="size-5" />
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Add Entry</Dialog.Title>
        </Dialog.Header>
        <div class="grid grid-cols-[1fr_4fr] gap-4">
          <Label>ID</Label>
          <!-- TODO: Find tf out why it's not working after once selected and cleared -->
          <Popover.Root bind:open={newEntry.popupOpen} onOpenChange={(op) => console.log("new open", op)}>
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
              <Popover.Trigger
                class={cn(buttonVariants({ variant: "outline" }), "w-fit")}
                disabled={pageStatus === "loading"}
              >
                Select User / Role
              </Popover.Trigger>
            {/if}
            <Popover.Content customAnchor={newEntry.customAnchor}>
              <MentionableSelect
                excludedRoleIds={newEntry.type === EntityType.role ? [newEntry.id] : []}
                excludedUserIds={newEntry.type === EntityType.user ? [newEntry.id] : []}
                onRoleSelect={(role) => newEntry.setRole(role)}
                onUserSelect={(user) => newEntry.setUser(user)}
              />
            </Popover.Content>
          </Popover.Root>

          <Label>Type</Label>
          <Select.Root
            type="single"
            name="new-type"
            bind:value={() => newEntry.type.toString(), (v) => (newEntry.type = parseInt(v))}
          >
            <Select.Trigger class="w-full sm:w-50">
              <span>{addDialog.types.find((t) => t.value === newEntry.type)!.label}</span>
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                {#each addDialog.types as _type}
                  <Select.Item value={_type.value.toString()}>{_type.label}</Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
          <Label>Scope</Label>
          <Dropdown.Root>
            <Dropdown.Trigger
              class={cn(
                "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none select-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                "w-full sm:w-50",
              )}
            >
              Select Scopes
              <ChevronDown class="size-4 opacity-50" />
            </Dropdown.Trigger>
            <Dropdown.Content class="w-50">
              <Dropdown.Group>
                {#each addDialog.scopes as _scope}
                  <Dropdown.Item
                    closeOnSelect={false}
                    onclick={() => {
                      console.log("toggled scope", _scope.value);
                      toggleScope(_scope.value);
                    }}
                  >
                    {#if newEntry.scopes.has(scopeToBit[_scope.value])}
                      <span class="absolute right-2 flex size-3.5 items-center justify-center">
                        <Check class="size-4" />
                      </span>
                    {/if}
                    {_scope.label}
                  </Dropdown.Item>
                {/each}
              </Dropdown.Group>
            </Dropdown.Content>
          </Dropdown.Root>
        </div>
        <Dialog.Footer>
          <Button type="submit">Save</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  </div>
</div>

<EntriesTable {entries} />
