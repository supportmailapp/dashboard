<script lang="ts">
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import type { ITicketCategory } from "supportmail-types";
  import { toast } from "svelte-sonner";
  import apiClient from "$lib/utils/apiClient";
  import { APIRoutes } from "$lib/urls";
  import { page } from "$app/state";
  import { Button, buttonVariants } from "$ui/button";
  import * as Dialog from "$ui/dialog/index.js";
  import Plus from "@lucide/svelte/icons/plus";
  import { Input } from "$ui/input";
  import { Label } from "$ui/label";
  import { cn } from "$lib/utils";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";

  let { data } = $props();

  const categories = new ConfigState(data.categories);

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

      const json = await res.json<ITicketCategory & { _id: string }>();
      newCategory.reset();
      categories.config?.push(json);
      toast.success("Ticket configuration saved successfully.");
    } catch (error: any) {
      toast.error(`Failed to save ticket configuration: ${error.message}`);
      return;
    } finally {
      categories.loading = false;
    }
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

  $effect(() => {
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
    // Cleanup
    return () => {
      console.log("Cleaning up ticket categories state");
      categories.clear();
    };
  });
</script>

<SiteHeading title="Ticket Categories" />

{#if categories.isConfigured()}
  <div class="flex w-full max-w-3xl flex-col justify-start gap-1.5">
    {#each categories.config as cat}
      <Button variant="outline" href={page.data.guildHref(`/ticket-categories/${cat._id}`)} size="xl">
        {cat.label}
        <ChevronRight class="ml-auto" />
      </Button>
    {/each}
    {#if categories.config.length < 10}
      <Dialog.Root bind:open={newCategory.open}>
        <Dialog.Trigger class={buttonVariants({ variant: "default", class: "w-full max-w-xs" })}>
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
  </div>
{:else}
  <div class="grid place-items-center">
    <LoadingSpinner />
  </div>
{/if}
