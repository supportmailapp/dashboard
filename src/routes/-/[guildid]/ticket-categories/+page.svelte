<script lang="ts">
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import ArrowUpRightIcon from "@lucide/svelte/icons/arrow-up-right";
  import FolderOpen from "@lucide/svelte/icons/folder-open";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash from "@lucide/svelte/icons/trash";
  import GitCompareArrows from "@lucide/svelte/icons/git-compare-arrows";

  import equal from "fast-deep-equal/es6";
  import { onDestroy, untrack } from "svelte";
  import { toast } from "svelte-sonner";
  import { flip } from "svelte/animate";
  import { cubicOut } from "svelte/easing";
  import { SvelteSet } from "svelte/reactivity";

  import { Badge } from "$ui/badge/index.js";
  import { Button, buttonVariants } from "$ui/button";
  import Checkbox from "$ui/checkbox/checkbox.svelte";
  import * as Dialog from "$ui/dialog/index.js";
  import * as Empty from "$ui/empty/index.js";
  import { Input } from "$ui/input";
  import { Label } from "$ui/label";

  import { afterNavigate } from "$app/navigation";
  import { page } from "$app/state";

  import AreYouSureDialog from "$lib/components/AreYouSureDialog.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SaveAlert from "$lib/components/SaveAlert.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import type { APITicketCategory } from "$lib/sm-types";
  import { guildHref } from "$lib/stores/site.svelte";
  import { APIRoutes, DocsLinks } from "$lib/urls";
  import { cn } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";

  const config = $state({
    old: null as APITicketCategory[] | null,
    current: null as APITicketCategory[] | null,
    saving: false,
    loading: true,
  });

  let unsavedChanges = $derived(
    !equal(
      untrack(() => config.old),
      config.current,
    ),
  );
  class SyncTags {
    open = $state(false);
    loading = $state(false);
    selected = new SvelteSet<string>();
    finalCats = $derived.by(() => {
      if (!config.old) {
        return [];
      }
      return $state.snapshot(config.old).sort((a, b) => {
        const aSelected = this.selected.has(a._id);
        const bSelected = this.selected.has(b._id);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return a.index - b.index;
      });
    });

    constructor() {
      for (const cat of $state.snapshot(config.old) ?? []) {
        if (cat.tag) {
          this.selected.add(cat._id);
        }
      }
    }

    load() {
      this.reset();
    }

    reset() {
      this.open = false;
      this.loading = false;
      this.selected.clear();
      for (const cat of $state.snapshot(config.old) ?? []) {
        if (cat.tag) {
          this.selected.add(cat._id);
        }
      }
    }

    toggleCategory(categoryId: string) {
      if (this.selected.has(categoryId)) {
        this.selected.delete(categoryId);
      } else {
        this.selected.add(categoryId);
      }
    }
  }
  const syncTags = new SyncTags();

  class NewCategory {
    open = $state(false);
    label = $state("");
    readonly isValid = $derived(this.label.length >= 3 && this.label.length <= 45);

    constructor() {}

    reset() {
      this.open = false;
      this.label = "";
    }
  }
  const newCategory = new NewCategory();

  async function syncTagsFn() {
    if (!syncTags.selected.size) {
      toast.error("Please select at least one category to sync.");
      return;
    }

    syncTags.loading = true;

    try {
      const res = await apiClient.post<ClientAPI.CategoriesTagsResult>(
        APIRoutes.syncTags(page.params.guildid!),
        {
          json: ($state.snapshot(config.old) ?? []).map((cat) => ({
            _id: cat._id,
            setTag: syncTags.selected.has(cat._id),
          })),
        },
      );

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to sync ticket category tags.");
      }

      const jsonRes = await res.json();
      if (jsonRes.data) {
        function updateStateWithNewData(
          state: APITicketCategory[],
          data: {
            categoryId: string;
            tagId: string;
          }[],
        ) {
          return state.map((cat) => {
            const updated = data.find((d) => d.categoryId === cat._id);
            if (updated) {
              return {
                ...cat,
                tag: updated.tagId,
              };
            } else {
              return {
                ...cat,
                tag: undefined,
              };
            }
          });
        }

        // update current before old to reduce latency to reset
        config.current = updateStateWithNewData($state.snapshot(config.current) ?? [], jsonRes.data);
        config.old = updateStateWithNewData($state.snapshot(config.old) ?? [], jsonRes.data);
      }

      toast.success("Ticket category tags sync started.");
      syncTags.reset();
    } catch (error: any) {
      toast.error(`Failed to sync ticket category tags: ${error.message}`);
    } finally {
      syncTags.loading = false;
    }
  }

  function createCategory() {
    if (!newCategory.isValid) {
      toast.error("Category Name must be between 3 and 45 characters long");
      return;
    }

    config.current = [
      {
        local: true,
        _id: new Date().toISOString(),
        guildId: page.params.guildid!,
        label: newCategory.label,
        index: (config.current?.length ?? 0) + 1,
        enabled: true,
        components: [],
      } satisfies APITicketCategory,
      ...(config.current ?? []),
    ].sort((a, b) => a.index - b.index) as APITicketCategory[];

    newCategory.reset();
    toast.success(`Category "${newCategory.label}" created.`);
  }

  async function saveCategories() {
    if (!config.current) {
      toast.error("No configuration to save.");
      return;
    }

    config.saving = true;

    try {
      const res = await apiClient.put(APIRoutes.ticketCategories(page.params.guildid!), {
        json: config.current
          .sort((a, b) => a.index - b.index)
          .map((cat) => ({
            _id: cat._id,
            label: cat.label,
            guildId: page.params.guildid!,
            index: cat.index,
            local: cat.local || undefined,
          })),
      });

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to save ticket categories.");
      }

      const _data = await res.json<APITicketCategory[]>();
      config.old = [..._data];
      config.current = [..._data];
      syncTags.load();
      toast.success("Ticket categories saved.");
    } catch (error: any) {
      toast.error(`Failed to save ticket categories: ${error.message}`);
    } finally {
      config.saving = false;
    }
  }

  async function deleteCategory(categoryId: string) {
    config.loading = true;

    try {
      const res = await apiClient.delete(APIRoutes.ticketCategory(page.params.guildid!, categoryId));

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to delete ticket category.");
      }

      if (config.current) {
        config.current = config.current.filter((cat) => cat._id !== categoryId);
        config.old = [...config.current];
      }
      toast.success("Ticket category deleted.");
    } catch (error: any) {
      toast.error(`Failed to delete ticket category: ${error.message}`);
    } finally {
      config.loading = false;
    }
  }

  // Reordering functions //

  function moveUp(index: number) {
    if (!config.current || index === 0) return;

    const newItems = [...config.current];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];

    // Update index values to match new order
    newItems.forEach((item, idx) => {
      item.index = idx;
    });

    config.current = newItems;
  }

  function moveDown(index: number) {
    if (!config.current || index === config.current.length - 1) return;

    const newItems = [...config.current];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];

    // Update index values to match new order
    newItems.forEach((item, idx) => {
      item.index = idx;
    });

    config.current = newItems;
  }

  $effect(() => {
    const labels = new Set();
    for (const cat of config.current ?? []) {
      if (!labels.has(cat.label)) {
        labels.add(cat.label);
      } else {
        toast.error(`Category label "${cat.label}" already exists.`);
        config.loading = false;
        return;
      }
    }
  });

  afterNavigate(async () => {
    try {
      const res = await apiClient.get<APITicketCategory[]>(APIRoutes.ticketCategories(page.params.guildid!));

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to load ticket categories.");
      }

      const data = await res.json();
      const normalized = (data ?? []).map((item: APITicketCategory, i: number) => ({
        ...item,
        index: typeof item.index === "number" ? item.index : i + 1,
      }));
      config.old = [...normalized];
      config.current = [...normalized];
      syncTags.load();
    } catch (err: any) {
      toast.error("Failed to load ticket categories.", {
        description: err.message,
      });
    } finally {
      config.loading = false;
    }
  });

  function resetCfg() {
    if (config.old && config.current) {
      config.current = [...config.old];
    }
  }

  onDestroy(resetCfg);
</script>

<SiteHeading title="Ticket Categories" />

<SaveAlert
  saving={config.saving}
  {unsavedChanges}
  discardChanges={() => {
    if (config.old && config.current) {
      config.current = [...config.old];
    }
  }}
  saveData={saveCategories}
/>

{#if config.current}
  {#if !!config.old?.length}
    <Button variant="outline" class="mb-4" onclick={() => (syncTags.open = true)}>
      <GitCompareArrows />
      Sync Category Tags
    </Button>
  {/if}
  <div class="flex w-full flex-col justify-start gap-1.5" class:max-w-3xl={config.current.length > 0}>
    <ul class="flex w-full flex-col gap-1">
      {#each config.current as cat, index (cat._id)}
        <li
          class={cn(
            "bg-background hover:text-accent-foreground dark:bg-input/30 flex h-16 flex-row items-center gap-3 rounded-lg border p-3 shadow-xs transition duration-100",
          )}
          animate:flip={{ duration: 200, easing: cubicOut }}
        >
          <Badge variant="outline">{cat.index + 1}</Badge>
          <span class="flex-1">{cat.label}</span>

          {#if config.current.length > 1}
            <div class="flex gap-1">
              <Button
                size="icon"
                variant="outline"
                onclick={() => moveUp(index)}
                disabled={index === 0 || config.loading}
                title="Move up"
              >
                <ArrowUp class="size-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onclick={() => moveDown(index)}
                disabled={index === config.current.length - 1 || config.loading}
                title="Move down"
              >
                <ArrowDown class="size-4" />
              </Button>
            </div>
          {/if}

          <Button href={guildHref(`/ticket-categories/${cat._id}`)}>
            <Pencil />
          </Button>
          <AreYouSureDialog
            title="Are you absolutely sure?"
            description="Are you sure you want to delete **{cat.label}**? This action cannot be undone."
            onYes={() => deleteCategory(cat._id)}
            disabled={config.loading}
          >
            <div
              class={buttonVariants({
                variant: "destructive",
                class: "sm:w-auto",
              })}
            >
              <Trash />
            </div>
          </AreYouSureDialog>
        </li>
      {/each}
      {#if config.current.length === 0}
        <Empty.Root>
          <Empty.Header>
            <Empty.Media variant="icon">
              <FolderOpen />
            </Empty.Media>
            <Empty.Title>No categories</Empty.Title>
            <Empty.Description
              >You need at least <b>two</b> categories for categories to work.</Empty.Description
            >
          </Empty.Header>
          <Empty.Content>
            <Button onclick={() => (newCategory.open = true)}>Create Category</Button>
          </Empty.Content>
          <Button
            variant="link"
            href={DocsLinks.TicketCategories}
            target="_blank"
            class="text-muted-foreground"
          >
            Learn more
            <ArrowUpRightIcon class="inline" />
          </Button>
        </Empty.Root>
      {/if}
    </ul>
    <div class="flex gap-2">
      {#if config.current.length < 10 && config.current.length > 0}
        <Button variant="outline" class="flex-1" onclick={() => (newCategory.open = true)}>
          <Plus class="size-7" />
          Add Category
        </Button>
      {/if}
    </div>
  </div>
{:else}
  <div class="grid place-items-center">
    <LoadingSpinner />
  </div>
{/if}

<Dialog.Root bind:open={newCategory.open}>
  <Dialog.Content class="space-y-4">
    <Dialog.Header>
      <Dialog.Title>Create Ticket Category</Dialog.Title>
    </Dialog.Header>
    <form
      class="flex w-full flex-col gap-1.5"
      onsubmit={(e) => {
        e.preventDefault();
        createCategory();
      }}
    >
      <Label for="new-cat-name">Category Name</Label>
      <Input
        bind:value={newCategory.label}
        class={cn(
          !newCategory.isValid
            ? "border-destructive-foreground ring-destructive-foreground"
            : "border-success-foreground ring-success-foreground",
        )}
        required
        type="text"
        autocomplete="off"
        id="new-cat-name"
        placeholder="Support, Bug, etc."
        minlength={3}
        maxlength={45}
        aria-invalid={!newCategory.isValid}
      />
      <Dialog.Footer>
        <Button type="submit">Create</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root
  bind:open={
    () => syncTags.open || syncTags.loading,
    (v) => {
      if (!syncTags.loading) syncTags.open = v;
    }
  }
  onOpenChangeComplete={() => syncTags.reset()}
>
  <Dialog.Content class="max-h-[80vh] space-y-4 overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Sync Tags</Dialog.Title>
      <Dialog.Description>
        Choose which categories should have tags applied. The bot will update forum tags based on your
        selection.
      </Dialog.Description>
    </Dialog.Header>

    <div class={cn("flex flex-col gap-2", syncTags.loading && "pointer-events-none opacity-50")}>
      {#each syncTags.finalCats as cat (`${cat._id}${syncTags.selected.has(cat._id)}`)}
        <button
          type="button"
          class="bg-card hover:bg-accent hover:text-accent-foreground flex items-center justify-between rounded-lg border p-3 text-left transition select-none"
          onclick={() => syncTags.toggleCategory(cat._id)}
          animate:flip={{ duration: 300 }}
        >
          <span>{cat.label}</span>
          <Checkbox readonly checked={syncTags.selected.has(cat._id)} aria-hidden="true" />
        </button>
      {/each}
    </div>

    <Dialog.Footer>
      <Button
        variant="default"
        onclick={syncTagsFn}
        disabled={syncTags.loading}
        showLoading={syncTags.loading}
      >
        Start Sync
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
