<script lang="ts">
  import { goto, invalidate } from "$app/navigation";
  import { page } from "$app/state";
  import Mention from "$lib/components/discord/Mention.svelte";
  import EmojiInput from "$lib/components/EmojiInput.svelte";
  import MentionableSelect from "$lib/components/MentionableSelect.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import { APIRoutes } from "$lib/urls.js";
  import { cn } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient.js";
  import { Button, buttonVariants } from "$ui/button";
  import * as Card from "$ui/card/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import { Input } from "$ui/input";
  import { Label } from "$ui/label";
  import * as Popover from "$ui/popover/index.js";
  import { Switch } from "$ui/switch";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Plus from "@lucide/svelte/icons/plus";
  import Save from "@lucide/svelte/icons/save";
  import Trash from "@lucide/svelte/icons/trash";
  import equal from "fast-deep-equal/es6";
  import { EntityType } from "supportmail-types";
  import { toast } from "svelte-sonner";

  let { data } = $props();

  const category = new ConfigState(
    data.category ? { ...data.category, emoji: data.category.emoji ?? { name: "" } } : null,
    !data.category,
  );

  $inspect("cat loading", category.loading);

  const labelIsValid = $derived(
    category.config && category.config.label!.length >= 3 && category.config.label!.length <= 45,
  );
  const pingUsers = $derived(
    category.config?.pings?.filter((e) => e.typ === EntityType.user).map((e) => e.id) ?? [],
  );
  const pingRoles = $derived(
    category.config?.pings?.filter((e) => e.typ === EntityType.role).map((e) => e.id) ?? [],
  );

  async function saveCategory(categoryId: string) {
    if (!category.evalUnsaved()) {
      toast.info("No changes to save.");
      return;
    }

    if (!labelIsValid) {
      toast.error("Please enter a valid category name (3-45 characters).");
      return;
    }

    category.loading = true;

    try {
      const res = await apiClient.put(APIRoutes.ticketCategory(page.data.guildId!, categoryId), {
        json: category.config,
      });

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to save ticket category.");
      }

      const json = await res.json<any>();
      category.saveConfig(json);
      toast.success("Ticket category saved successfully.");
      invalidate("ticket-category-" + page.params.categoryid);
    } catch (error: any) {
      toast.error(`Failed to save ticket category: ${error.message}`);
    } finally {
      category.loading = false;
    }
  }

  async function deleteCategory(categoryId: string) {
    category.loading = true;

    try {
      const res = await apiClient.delete(APIRoutes.ticketCategory(page.data.guildId!, categoryId));

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to delete ticket category.");
      }

      toast.success("Ticket category deleted successfully.");
      navigateBack();
    } catch (error: any) {
      toast.error(`Failed to delete ticket category: ${error.message}`);
    } finally {
      category.loading = false;
    }
  }

  function navigateBack() {
    goto(page.data.guildHref("/ticket-categories"));
  }

  function handlePingDelete(entityToRemove: any) {
    if (category.config) {
      category.config.pings = (category.config.pings ?? []).filter((e) => !equal(e, entityToRemove));
      return true;
    }
    return false;
  }

  function handleRoleSelect(role: any) {
    if (category.config) {
      if (!category.config.pings) {
        category.config.pings = [{ typ: EntityType.role, id: role.id }];
      } else {
        category.config.pings = [...category.config.pings, { typ: EntityType.role, id: role.id }];
      }
    }
  }

  function handleUserSelect(user: any) {
    if (category.config) {
      if (!category.config.pings) {
        category.config.pings = [{ typ: EntityType.user, id: user.id }];
      } else {
        category.config.pings = [...category.config.pings, { typ: EntityType.user, id: user.id }];
      }
    }
  }
</script>

<div class="container mx-auto max-w-4xl space-y-6 py-6">
  <div class="flex items-center gap-4">
    <Button variant="ghost" size="sm" onclick={navigateBack}>
      <ArrowLeft class="mr-2 h-4 w-4" />
      Back to Categories
    </Button>
  </div>

  <SiteHeading title="Edit Ticket Category" subtitle={data.category?.label ?? "Unknown Category"} />

  {#if !category.isConfigured()}
    <Card.Root>
      <Card.Content class="pt-6">
        <div class="text-center">
          <p class="text-muted-foreground">Category not found or failed to load.</p>
          <Button variant="outline" onclick={navigateBack} class="mt-4">Return to Categories</Button>
        </div>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Basic Settings -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Basic Settings</Card.Title>
          <Card.Description>Configure the basic properties of your ticket category.</Card.Description>
        </Card.Header>
        <Card.Content class="space-y-5">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label for="cat-enabled">Enable Category</Label>
              <p class="text-muted-foreground text-sm">Allow users to create tickets in this category</p>
            </div>
            <Switch bind:checked={category.config.enabled} id="cat-enabled" />
          </div>

          <div class="space-y-2">
            <Label for="cat-label">Category Name</Label>
            <Input
              bind:value={category.config.label}
              class={cn(
                !labelIsValid && category.config.label!.length > 0
                  ? "border-destructive focus:ring-destructive"
                  : "",
              )}
              type="text"
              autocomplete="off"
              id="cat-label"
              placeholder="Support, Bug Reports, General Help..."
              minlength={3}
              maxlength={45}
              aria-invalid={!labelIsValid}
              disabled={category.loading}
            />
            {#if !labelIsValid && category.config.label!.length > 0}
              <p class="text-destructive text-sm">Name must be between 3 and 45 characters</p>
            {/if}
          </div>
          <div class="flex items-center justify-between">
            <EmojiInput bind:emoji={category.config.emoji} />
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Ping Settings -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Notification Settings</Card.Title>
          <Card.Description>
            Configure who gets pinged when tickets are created in this category.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="space-y-2">
            <Label>Category Pings</Label>
            <div class="bg-accent/50 max-h-40 min-h-20 w-full overflow-y-auto rounded-md border p-3">
              {#if (category.config.pings ?? []).length === 0}
                <p class="text-muted-foreground text-sm">
                  No pings configured. Add users or roles to notify when tickets are created.
                </p>
              {:else}
                <div class="flex flex-wrap gap-2">
                  {#each category.config.pings ?? [] as entity}
                    <Mention
                      class="w-max"
                      userId={entity.typ === EntityType.user ? entity.id : undefined}
                      roleId={entity.typ === EntityType.role ? entity.id : undefined}
                      onDelete={() => handlePingDelete(entity)}
                    />
                  {/each}
                </div>
              {/if}

              <div class="mt-2">
                <Popover.Root>
                  <Popover.Trigger
                    class={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      class: "h-8",
                    })}
                    disabled={category.loading}
                  >
                    <Plus class="mr-2 h-4 w-4" />
                    Add Ping
                  </Popover.Trigger>
                  <Popover.Content class="w-80">
                    <MentionableSelect
                      excludedRoleIds={pingRoles}
                      excludedUserIds={pingUsers}
                      onRoleSelect={handleRoleSelect}
                      onUserSelect={handleUserSelect}
                    />
                  </Popover.Content>
                </Popover.Root>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Action Buttons -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Danger Zone</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <AlertDialog.Root>
            <AlertDialog.Trigger
              class={buttonVariants({
                variant: "destructive",
                class: "sm:w-auto",
              })}
              disabled={category.loading}
            >
              <Trash class="mr-2 h-4 w-4" />
              Delete Category
            </AlertDialog.Trigger>
            <AlertDialog.Content>
              <AlertDialog.Header>
                <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
                <AlertDialog.Description>
                  Are you sure you want to delete <strong>{category.config.label}</strong>? This action cannot
                  be undone.
                </AlertDialog.Description>
              </AlertDialog.Header>
              <AlertDialog.Footer>
                <AlertDialog.Cancel>No</AlertDialog.Cancel>
                <AlertDialog.Action
                  onclick={() => {
                    deleteCategory(category.config._id);
                  }}
                  disabled={category.loading}
                >
                  Yes
                </AlertDialog.Action>
              </AlertDialog.Footer>
            </AlertDialog.Content>
          </AlertDialog.Root>

          <Button
            onclick={() => saveCategory(category.config._id)}
            disabled={category.loading || !labelIsValid}
            class="sm:w-auto"
          >
            {#if category.loading}
              <div
                class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              ></div>
              Saving...
            {:else}
              <Save class="mr-2 h-4 w-4" />
              Save Changes
            {/if}
          </Button>
        </div>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
