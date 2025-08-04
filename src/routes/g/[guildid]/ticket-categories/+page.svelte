<script lang="ts">
  import { invalidate } from "$app/navigation";
  import { page } from "$app/state";
  import AreYouSureDialog from "$lib/components/AreYouSureDialog.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import { APIRoutes } from "$lib/urls";
  import { cn } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import { Badge } from "$ui/badge/index.js";
  import { Button, buttonVariants } from "$ui/button";
  import { Checkbox } from "$ui/checkbox";
  import * as Dialog from "$ui/dialog/index.js";
  import { Input } from "$ui/input";
  import { Label } from "$ui/label";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Plus from "@lucide/svelte/icons/plus";
  import Save from "@lucide/svelte/icons/save";
  import Trash from "@lucide/svelte/icons/trash";
  import type { ITicketCategory } from "supportmail-types";
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import { slide } from "svelte/transition";

  let { data } = $props();

  const categories = new ConfigState(data.categories, false);

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

  async function createCategory() {
    if (!newCategory.isValid) {
      toast.error("Category Name must be between 3 and 45 characters long");
      return;
    }

    categories.loading = true;

    try {
      const res = await apiClient.post(APIRoutes.ticketCategories(page.data.guildId!), {
        json: {
          label: $state.snapshot(newCategory.label),
        },
      });

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to save ticket configuration.");
      }

      const json = await res.json<DocumentWithId<Omit<ITicketCategory, "_id" | "__v">>>();
      categories.saveConfig([...(categories.config ?? []), json]);
      newCategory.reset();
      toast.success("Ticket category created.");
      categories.loading = false;
      // invalidate("ticket-categories");
    } catch (error: any) {
      toast.error(`Failed to save ticket configuration: ${error.message}`);
      return;
    } finally {
      categories.loading = false;
    }
  }

  async function saveCategories() {
    const current = categories.snap();
    const currentOrder = current?.map((c) => c._id).join() ?? "";
    const oldOrder = categories.backup?.map((c) => c._id).join() ?? "";

    if (currentOrder === oldOrder) {
      toast.info("Nothing to save.");
      return;
    }

    categories.loading = true;

    try {
      const res = await apiClient.put(APIRoutes.ticketCategories(page.data.guildId!), {
        json:
          current
            ?.sort((a, b) => a.index - b.index)
            .map((cat) => ({
              _id: cat._id,
              guildId: cat.guildId,
            })) ?? [],
      });

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to save ticket categories.");
      }

      toast.success("Ticket categories saved.");
      categories.loading = false;
      invalidate("ticket-categories");
    } catch (error: any) {
      toast.error(`Failed to save ticket categories: ${error.message}`);
      categories.loading = false;
    }
  }

  async function deleteCategory(categoryId: string) {
    categories.loading = true;

    try {
      const res = await apiClient.delete(APIRoutes.ticketCategory(page.data.guildId!, categoryId));

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to delete ticket category.");
      }

      toast.success("Ticket category deleted.");
      categories.loading = false;
      invalidate("ticket-categories");
    } catch (error: any) {
      toast.error(`Failed to delete ticket category: ${error.message}`);
    } finally {
      categories.loading = false;
    }
  }

  // Dragging utils //

  let draggedItem: DocumentWithId<Omit<ITicketCategory, "_id" | "__v">> | null = $state(null);
  let draggedOverIndex = $state(-1);
  let reorderingEnabled = $state(false);

  type MyDragEvent = DragEvent & {
    currentTarget: EventTarget & HTMLLIElement;
  };

  function handleDragStart(
    event: MyDragEvent,
    item: DocumentWithId<Omit<ITicketCategory, "_id" | "__v">>,
    index: number,
  ) {
    if (!reorderingEnabled) {
      event.preventDefault();
      return;
    }
    if (!event.dataTransfer) return;

    draggedItem = { ...item, index };
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/html", event.currentTarget.outerHTML);
    event.currentTarget.style.opacity = "0.5";
  }

  function handleDragEnd(event: MyDragEvent) {
    event.currentTarget.style.opacity = "1";
    draggedItem = null;
    draggedOverIndex = -1;
  }

  function handleDragOver(event: any, index: number) {
    if (!reorderingEnabled) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    draggedOverIndex = index;
  }

  function handleDragLeave() {
    draggedOverIndex = -1;
  }

  function handleDrop(event: MyDragEvent, dropIndex: number) {
    if (!reorderingEnabled || !categories.isConfigured()) return;
    event.preventDefault();

    if (draggedItem && draggedItem.index !== dropIndex) {
      const newItems = [...categories.config];
      const draggedElement = newItems.splice(draggedItem.index, 1)[0];
      newItems.splice(dropIndex, 0, draggedElement);

      // Update position values to match new order
      newItems.forEach((item, index) => {
        item.index = index + 1;
      });

      categories.setConfig(newItems);
    }

    draggedOverIndex = -1;
  }

  $effect(() => {
    const labels = new Set();
    for (const cat of categories.config ?? []) {
      if (!labels.has(cat.label)) {
        labels.add(cat.label);
      } else {
        toast.error(`Category label "${cat.label}" already exists.`);
        categories.loading = false;
        return;
      }
    }
  });

  onMount(() => {
    fetch(APIRoutes.ticketCategories(page.data.guildId!))
      .then((res) => {
        if (!res.ok) {
          toast.error("Failed to load ticket categories.", {
            description: "Please try again later.",
          });
          return;
        }
        res.json().then((data: DocumentWithId<ITicketCategory>[]) => {
          categories.saveConfig(data);
        });
      })
      .catch((err) => {
        toast.error("Failed to load ticket categories.", {
          description: err.message,
        });
      });

    return () => {
      console.log("Cleaning up ticket categories state");
      categories.clear();
    };
  });
</script>

<SiteHeading title="Ticket Categories" />

{#if categories.isConfigured()}
  <div class="flex w-full max-w-2xl flex-col justify-start gap-1.5">
    {#if categories.config && categories.config.length > 1}
      <div class="pb-4">
        <Label class="w-fit">
          <Checkbox bind:checked={reorderingEnabled} />
          Enable reordering
        </Label>
      </div>
    {/if}
    <ul class="flex w-full flex-col gap-1">
      {#each categories.config as cat, index (cat.index)}
        <li
          class={cn(
            "bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/70 flex h-16 flex-row items-center gap-3 rounded border p-3 shadow-xs transition duration-100 select-none",
            draggedOverIndex === index && "border-primary dark:border-primary scale-101 border-2",
            reorderingEnabled ? "cursor-grab hover:-translate-y-0.5" : "cursor-default",
          )}
          draggable={reorderingEnabled}
          ondragstart={(event) => handleDragStart(event, cat, index)}
          ondragend={handleDragEnd}
          ondragover={(event) => handleDragOver(event, index)}
          ondragleave={handleDragLeave}
          ondrop={(event) => handleDrop(event, index)}
        >
          {#if reorderingEnabled}
            <span class="drag-handle" transition:slide={{ duration: 150, axis: "x" }}>⋮⋮</span>
          {/if}
          <Badge variant="outline">{cat.index}</Badge>
          <span>{cat.label}</span>
          {#if !reorderingEnabled}
            <Button class="ml-auto" href={page.data.guildHref(`/ticket-categories/${cat._id}`)}>
              <Pencil />
            </Button>
            <AreYouSureDialog
              title="Are you absolutely sure?"
              description="Are you sure you want to delete **{cat.label}**? This action cannot be undone."
              onYes={() => deleteCategory(cat._id)}
              disabled={categories.loading}
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
          {/if}
        </li>
      {/each}
      {#if categories.config.length === 0}
        <li class="text-muted-foreground my-2 text-sm">No categories configured.</li>
      {/if}
    </ul>
    <div class="flex gap-2">
      {#if categories.config.length < 10}
        <Dialog.Root bind:open={newCategory.open}>
          <Dialog.Trigger class={buttonVariants({ variant: "outline", class: "flex-1" })}>
            <Plus class="size-7" />
            Add Category
          </Dialog.Trigger>
          <Dialog.Content class="space-y-4">
            <Dialog.Header>
              <Dialog.Title>Create Ticket Category</Dialog.Title>
            </Dialog.Header>
            <form
              class="flex w-full flex-col gap-1.5"
              onsubmit={async (e) => {
                e.preventDefault();
                await createCategory();
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
      {/if}
      {#if categories.config.length > 0}
        <Button
          class="flex-1"
          onclick={saveCategories}
          disabled={categories.loading}
          showLoading={categories.loading}
        >
          <Save class="mr-0.5 size-4" />
          Save
        </Button>
      {/if}
    </div>
  </div>
{:else}
  <div class="grid place-items-center">
    <LoadingSpinner />
  </div>
{/if}
