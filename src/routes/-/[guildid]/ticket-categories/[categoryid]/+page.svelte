<script lang="ts">
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash from "@lucide/svelte/icons/trash";
  import XIcon from "@lucide/svelte/icons/x";

  import { afterNavigate, goto } from "$app/navigation";
  import { page } from "$app/state";
  import AreYouSureDialog from "$lib/components/AreYouSureDialog.svelte";
  import Mention from "$lib/components/discord/Mention.svelte";
  import EmojiInput from "$lib/components/EmojiInput.svelte";
  import SaveAlert from "$lib/components/SaveAlert.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import { EntityType, type AnyAPIFormComponent, type ITicketCategory } from "$lib/sm-types";
  import { APIRoutes } from "$lib/urls.js";
  import { cn, SnowflakeUtil } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient.js";
  import { Badge } from "$ui/badge/index.js";
  import { Button, buttonVariants } from "$ui/button";
  import * as Card from "$ui/card/index.js";
  import { Input } from "$ui/input";
  import { Label } from "$ui/label";
  import * as Popover from "$ui/popover/index.js";
  import { Switch } from "$ui/switch";
  import { ComponentType } from "discord-api-types/v10";
  import equal from "fast-deep-equal/es6";
  import { onDestroy, untrack } from "svelte";
  import { toast } from "svelte-sonner";
  import { flip } from "svelte/animate";
  import { fly } from "svelte/transition";
  import FieldDialog from "$lib/components/forms/FieldDialog.svelte";
  import MentionableSelect from "$lib/components/discord/MentionableSelect.svelte";
  import { validateEmoji } from "$lib/utils/formatting.js";
  import { guildHref } from "$lib/stores/site.svelte.js";

  let { data } = $props();

  type CategoryData = DocumentWithId<ITicketCategory>;

  const config = $state({
    old: null as CategoryData | null,
    current: null as CategoryData | null,
    saving: false,
    loading: false,
  });

  $inspect("current cfg emoji", config.current?.emoji);

  let unsavedChanges = $derived(
    !equal(
      untrack(() => config.old),
      config.current,
    ),
  );

  let editDialogOpen = $state(false);
  let editField = $state<AnyAPIFormComponent | null>(null);

  afterNavigate(() => {
    if (data.category) {
      const categoryData: any = { ...data.category, emoji: data.category.emoji ?? { name: "" } };
      config.old = { ...categoryData };
      config.current = { ...categoryData };
    }
  });

  const labelIsValid = $derived(
    config.current && config.current.label!.length >= 3 && config.current.label!.length <= 45,
  );
  const pingUsers = $derived(
    config.current?.pings?.filter((e) => e.typ === EntityType.user).map((e) => e.id) ?? [],
  );
  const pingRoles = $derived(
    config.current?.pings?.filter((e) => e.typ === EntityType.role).map((e) => e.id) ?? [],
  );

  async function saveCategory() {
    if (!config.current) {
      toast.error("No configuration to save.");
      return;
    }

    if (!labelIsValid) {
      toast.error("Please enter a valid category name (3-45 characters).");
      return;
    }

    config.saving = true;

    const payload = $state.snapshot(config.current);

    // Remove the index field from the payload
    const { index, ...payloadWithoutIndex } = payload;

    try {
      const res = await apiClient.put(APIRoutes.ticketCategory(page.params.guildid!, config.current._id), {
        json: payloadWithoutIndex,
      });

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to save ticket category.");
      }

      const _data = await res.json<CategoryData>();
      config.old = { ..._data };
      config.current = { ..._data };
      toast.success("Ticket category saved.");
    } catch (error: any) {
      toast.error(`Failed to save ticket category: ${error.message}`);
    } finally {
      config.saving = false;
    }
  }

  async function deleteCategory() {
    if (!config.current) return;

    config.loading = true;

    try {
      const res = await apiClient.delete(APIRoutes.ticketCategory(page.params.guildid!, config.current._id));

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to delete ticket category.");
      }

      toast.success("Ticket category deleted.");
      navigateBack();
    } catch (error: any) {
      toast.error(`Failed to delete ticket category: ${error.message}`);
    } finally {
      config.loading = false;
    }
  }

  function navigateBack() {
    goto(guildHref("/ticket-categories"));
  }

  function handlePingDelete(entityToRemove: any) {
    if (config.current) {
      config.current.pings = (config.current.pings ?? []).filter((e) => !equal(e, entityToRemove));
      return true;
    }
    return false;
  }

  function handleRoleSelect(role: any) {
    if (config.current) {
      if (!config.current.pings) {
        config.current.pings = [{ typ: EntityType.role, id: role.id }];
      } else {
        config.current.pings = [...config.current.pings, { typ: EntityType.role, id: role.id }];
      }
    }
  }

  function handleUserSelect(user: any) {
    if (config.current) {
      if (!config.current.pings) {
        config.current.pings = [{ typ: EntityType.user, id: user.id }];
      } else {
        config.current.pings = [...config.current.pings, { typ: EntityType.user, id: user.id }];
      }
    }
  }

  // Field stuff
  function addField() {
    if (!config.current) return;

    const newField: AnyAPIFormComponent = {
      local: true,
      id: SnowflakeUtil.generate().toString(),
      type: ComponentType.TextDisplay,
      content: "Hello World",
    };

    config.current.components = [...config.current.components, newField];
  }

  // Field reordering functions
  function moveFieldUp(index: number) {
    if (!config.current || index === 0) return;

    const newFields = [...config.current.components];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];

    config.current.components = newFields;
  }

  function moveFieldDown(index: number) {
    if (!config.current || index === config.current.components.length - 1) return;

    const newFields = [...config.current.components];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];

    config.current.components = newFields;
  }

  function resetCfg() {
    if (config.old && config.current) {
      config.current = { ...config.old };
    }
  }

  onDestroy(resetCfg);
</script>

<SaveAlert
  saving={config.saving}
  {unsavedChanges}
  discardChanges={() => {
    if (config.old && config.current) {
      config.current = { ...config.old };
    }
  }}
  saveData={saveCategory}
/>

<div class="container max-w-4xl space-y-6" in:fly={{ x: -30, duration: 200 }}>
  <div class="flex items-center gap-4">
    <Button variant="ghost" size="sm" onclick={navigateBack}>
      <ArrowLeft class="mr-2 h-4 w-4" />
      Back to Categories
    </Button>
  </div>

  <SiteHeading title="Edit Ticket Category" subtitle={data.category?.label ?? "Unknown Category"} />

  {#if !config.current}
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
          <div class="space-y-2">
            <Label for="cat-label">Category Name</Label>
            <Input
              bind:value={config.current.label}
              class={cn(
                !labelIsValid && config.current.label!.length > 0
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
              disabled={config.loading}
            />
            {#if !labelIsValid && config.current.label!.length > 0}
              <p class="text-destructive text-sm">Name must be between 3 and 45 characters</p>
            {/if}
          </div>
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label for="cat-enabled">Enable Category</Label>
              <p class="text-muted-foreground text-sm">Allow users to create tickets in this category</p>
            </div>
            <Switch variant="success" bind:checked={config.current.enabled} id="cat-enabled" />
          </div>
          <div class="flex items-center justify-start gap-2">
            <EmojiInput
              bind:emoji={
                () => config.current?.emoji || "",
                (v) => {
                  if (config.current) {
                    config.current.emoji = v;
                  }
                }
              }
            />
            {#if validateEmoji(config.current.emoji || "")}
              <Button
                size="icon"
                variant="destructive"
                onclick={() => {
                  if (config.current) {
                    config.current.emoji = "";
                  }
                }}
                aria-label="Reset "
              >
                <XIcon />
              </Button>
            {/if}
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
        <Card.Content class="space-y-2">
          <Label>Category Pings</Label>
          <div
            class="bg-input/30 border-input max-h-40 min-h-20 w-full overflow-y-auto rounded-md border p-3"
          >
            {#if (config.current.pings ?? []).length === 0}
              <p class="text-muted-foreground text-sm">
                No pings configured. Add users or roles to notify when tickets are created.
              </p>
            {:else}
              <div class="flex flex-wrap gap-2">
                {#each config.current.pings ?? [] as entity}
                  <Mention
                    class="w-max"
                    userId={entity.typ === EntityType.user ? entity.id : undefined}
                    roleId={entity.typ === EntityType.role ? entity.id : undefined}
                    onDelete={() => handlePingDelete(entity)}
                  />
                {/each}
                <Popover.Root>
                  <Popover.Trigger
                    class={buttonVariants({ variant: "outline", size: "icon", class: "size-7" })}
                    disabled={config.loading}
                  >
                    <Plus />
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
            {/if}
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <Card.Root>
      <Card.Header>
        <Card.Title>Custom Modal Fields</Card.Title>
        <Card.Description>
          Have up to 5 questions, the user is asked before creating a ticket.
        </Card.Description>
      </Card.Header>
      <Card.Content class="w-auto space-y-2">
        {#if config.current.components.length > 0}
          <div class="flex w-auto max-w-2xl flex-col gap-1 overflow-y-auto">
            {#each config.current.components as field, index (field.id)}
              <div
                class={cn(
                  "bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/70 flex h-16 w-full flex-row items-center gap-3 rounded border p-3 shadow-xs transition duration-100",
                )}
                animate:flip={{ duration: 250 }}
              >
                <Badge variant="outline">{index + 1}</Badge>
                <span class="flex-1">
                  {field.type !== ComponentType.TextDisplay ? field.label : field.content.slice(0, 100)}
                </span>

                {#if config.current.components.length > 1}
                  <div class="flex gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      onclick={() => moveFieldUp(index)}
                      disabled={index === 0 || config.loading}
                      title="Move up"
                    >
                      <ArrowUp class="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onclick={() => moveFieldDown(index)}
                      disabled={index === config.current.components.length - 1 || config.loading}
                      title="Move down"
                    >
                      <ArrowDown class="size-4" />
                    </Button>
                  </div>
                {/if}

                <Button
                  onclick={() => {
                    if (config.current) {
                      editField = $state.snapshot(config.current.components[index]);
                      console.log("Editing field:", $state.snapshot(editField));
                      editDialogOpen = true;
                    }
                  }}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="destructive"
                  onclick={() => {
                    if (confirm("Do you really want to delete this field?")) {
                      config.current!.components = config.current!.components.filter(
                        (f) => f.id !== field.id,
                      );
                    }
                  }}
                >
                  <Trash />
                </Button>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-muted-foreground mb-3 text-sm">No fields added.</p>
        {/if}

        {#if config.current.components.length < 5}
          <Button variant="outline" class="mt-2" onclick={() => addField()} disabled={config.loading}>
            <Plus />
            Add Field
          </Button>
        {/if}
      </Card.Content>
    </Card.Root>

    <FieldDialog
      bind:field={editField}
      bind:open={editDialogOpen}
      saveBtnLabel="Save"
      onSave={(f) => {
        // Only update the component list when a field is saved
        if (config.current && f) {
          config.current.components = config.current.components.map((field) =>
            field.id === f.id ? f : field,
          );
        }
        editDialogOpen = false;
        editField = null;
      }}
    />

    <!-- Action Buttons -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Actions</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <AreYouSureDialog
            title="Are you absolutely sure?"
            description="Are you sure you want to delete **{config.current
              .label}**? This action cannot be undone."
            onYes={deleteCategory}
            disabled={config.loading}
          >
            <div
              class={buttonVariants({
                variant: "destructive",
                class: "sm:w-auto",
              })}
            >
              <Trash class="mr-2 h-4 w-4" />
              Delete Category
            </div>
          </AreYouSureDialog>
        </div>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
