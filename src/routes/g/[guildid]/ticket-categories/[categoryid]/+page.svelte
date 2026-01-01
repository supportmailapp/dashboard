<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import AreYouSureDialog from "$lib/components/AreYouSureDialog.svelte";
  import Mention from "$lib/components/discord/Mention.svelte";
  import EmojiInput from "$lib/components/EmojiInput.svelte";
  import MentionableSelect from "$lib/components/MentionableSelect.svelte";
  import SaveAlert from "$lib/components/SaveAlert.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import { EntityType, type ICustomModalField, type ITicketCategory } from "$lib/sm-types";
  import { APIRoutes } from "$lib/urls.js";
  import { cn } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient.js";
  import { EmojiParser } from "$lib/utils/formatting.js";
  import { Badge } from "$ui/badge/index.js";
  import { Button, buttonVariants } from "$ui/button";
  import * as Card from "$ui/card/index.js";
  import { Checkbox } from "$ui/checkbox/index.js";
  import * as Dialog from "$ui/dialog/index.js";
  import { Input } from "$ui/input";
  import { Label } from "$ui/label";
  import * as Popover from "$ui/popover/index.js";
  import * as RadioGroup from "$ui/radio-group/index.js";
  import { Switch } from "$ui/switch";
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash from "@lucide/svelte/icons/trash";
  import XIcon from "@lucide/svelte/icons/x";
  import equal from "fast-deep-equal/es6";
  import { onDestroy, untrack } from "svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();

  type CategoryData = DocumentWithId<ITicketCategory>;

  const config = $state({
    old: null as CategoryData | null,
    current: null as CategoryData | null,
    saving: false,
    loading: false,
  });

  let unsavedChanges = $derived(!equal(untrack(() => config.old), config.current));

  const dialogState = $state({
    new: false,
    edit: false,
  });

  let highestPos = $derived(
    config.current
      ? config.current.fields.reduce((acc, cur) => {
          if (cur.position > acc) return cur.position;
          return acc;
        }, 0) + 1
      : 1,
  );

  const newField = $state<Required<ICustomModalField>>({
    label: "",
    placeholder: "",
    minL: 0,
    maxL: 100,
    position: 1,
    style: 1,
    _required: false,
  });

  const editField = $state({
    data: null as ICustomModalField | null,
  });

  $effect(() => {
    if (highestPos !== newField.position) {
      newField.position = highestPos;
    }
  });

  $effect(() => {
    if (data.category) {
      const categoryData = { ...data.category, emoji: data.category.emoji ?? { name: "" } };
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
    if (payload && payload.emoji?.name === "") {
      payload.emoji = undefined;
    }

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
    goto(page.data.guildHref("/ticket-categories"));
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
  function saveField(whichOne: "new" | "edit") {
    if (whichOne === "new") {
      config.current?.fields.push($state.snapshot(newField));
      dialogState.new = false;
      // Reset newField
      newField.label = "";
      newField.placeholder = "";
      newField.minL = 0;
      newField.maxL = 100;
      newField.position = highestPos;
      newField.style = 1;
      newField._required = false;
    } else {
      // Find and update the existing field by position
      const fieldIndex = config.current?.fields.findIndex((f) => f.position === editField.data?.position);
      if (fieldIndex !== undefined && fieldIndex !== -1 && config.current && editField.data) {
        config.current.fields[fieldIndex] = $state.snapshot(editField.data);
      }
      dialogState.edit = false;
    }
  }

  // Field reordering functions
  function moveFieldUp(index: number) {
    if (!config.current || index === 0) return;

    const newFields = [...config.current.fields];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];

    // Update position values to match new order
    newFields.forEach((field, idx) => {
      field.position = idx + 1;
    });

    config.current.fields = newFields;
  }

  function moveFieldDown(index: number) {
    if (!config.current || index === config.current.fields.length - 1) return;

    const newFields = [...config.current.fields];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];

    // Update position values to match new order
    newFields.forEach((field, idx) => {
      field.position = idx + 1;
    });

    config.current.fields = newFields;
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
    unsavedChanges={unsavedChanges}
    discardChanges={() => {
      if (config.old && config.current) {
        config.current = { ...config.old };
      }
    }}
  saveData={saveCategory}
/>

<div class="container max-w-4xl space-y-6">
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
            {#if config.current.emoji}
              <EmojiInput bind:emoji={config.current.emoji} />
              {#if EmojiParser.isValid(config.current.emoji)}
                <Button
                  size="icon"
                  variant="destructive"
                  onclick={() => {
                    if (config.current) {
                      config.current.emoji = { name: "", animated: false, id: "" };
                    }
                  }}
                  aria-label="Reset "
                >
                  <XIcon />
                </Button>
              {/if}
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
      <Card.Content class="space-y-2">
        {#if config.current.fields.length > 0}
          <ul class="flex max-w-2xl flex-col gap-1">
            {#each config.current.fields as field, index (field.position)}
              <li
                class={cn(
                  "bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/70 flex h-16 flex-row items-center gap-3 rounded border p-3 shadow-xs transition duration-100",
                )}
              >
                <Badge variant="outline">{field.position}</Badge>
                <span class="flex-1">{field.label}</span>
                
                {#if config.current.fields.length > 1}
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
                      disabled={index === config.current.fields.length - 1 || config.loading}
                      title="Move down"
                    >
                      <ArrowDown class="size-4" />
                    </Button>
                  </div>
                {/if}
                
                <Button
                  onclick={() => {
                    if (config.current) {
                      editField.data = $state.snapshot(config.current.fields[index]);
                      dialogState.edit = true;
                    }
                  }}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="destructive"
                  onclick={() => {
                    if (confirm("Do you really want to delete this field?")) {
                      config.current!.fields = config.current!.fields.filter((f) => f.position !== field.position);
                    }
                  }}
                >
                  <Trash />
                </Button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="text-muted-foreground mb-3 text-sm">No fields added.</p>
        {/if}

        {#if config.current.fields.length < 5}
          <Dialog.Root
            bind:open={dialogState.new}
            onOpenChangeComplete={(opn) => {
              if (!opn) {
                // Reset newField on close
                newField.label = "";
                newField.placeholder = "";
                newField.minL = 0;
                newField.maxL = 100;
                newField.position = highestPos;
                newField.style = 1;
                newField._required = false;
              }
            }}
          >
            <Dialog.Trigger class={buttonVariants({ variant: "outline" })}>
              <Plus />
              Add Field
            </Dialog.Trigger>
            <Dialog.Content class="gap-6">
              <Dialog.Header>
                <Dialog.Title>Add new field</Dialog.Title>
              </Dialog.Header>

              <form
                class="flex flex-col gap-6"
                onsubmit={(e) => {
                  e.preventDefault();
                  saveField("new");
                }}
              >
                <div class="flex w-full max-w-sm flex-col gap-1.5">
                  <Label for="new-label">Label</Label>
                  <Input
                    required
                    type="text"
                    id="new-label"
                    bind:value={newField.label}
                    placeholder="The question to ask"
                    minlength={3}
                    maxlength={45}
                  />
                </div>

                <div class="flex w-full max-w-sm flex-col gap-1.5">
                  <Label for="new-ph">Placeholder</Label>
                  <Input
                    type="text"
                    id="new-ph"
                    bind:value={newField.placeholder}
                    placeholder="The placeholder to show"
                    minlength={0}
                    maxlength={100}
                  />
                </div>

                <div class="flex w-full max-w-sm flex-col gap-1.5">
                  <Label for="new-style">Style</Label>
                  <RadioGroup.Root
                    bind:value={
                      () => (newField.style === 1 ? "short" : "long"),
                      (v: "short" | "long") => (newField.style = v === "short" ? 1 : 2)
                    }
                  >
                    <div class="flex items-center space-x-2">
                      <RadioGroup.Item value="short" id="new-style-short" />
                      <Label for="new-style-short">Short (One Line)</Label>
                    </div>
                    <div class="flex items-center space-x-2">
                      <RadioGroup.Item value="long" id="new-style-long" />
                      <Label for="new-style-long">Paragraph (Multiline)</Label>
                    </div>
                  </RadioGroup.Root>
                </div>

                <div class="flex w-full max-w-sm flex-col gap-1.5">
                  <div class="flex w-full max-w-sm flex-col gap-1">
                    <Label>Minimum Input Length</Label>
                    <Input type="number" min={0} max={4000} bind:value={newField.minL} />
                  </div>
                  <div class="flex w-full max-w-sm flex-col gap-1">
                    <Label>Maximum Input Length</Label>
                    <Input type="number" min={1} max={4000} bind:value={newField.maxL} />
                  </div>
                </div>

                <div class="flex w-full max-w-sm flex-col gap-1.5">
                  <Label for="new-required">
                    <Checkbox bind:checked={newField._required} id="new-required" />
                    Required
                  </Label>
                  <p class="text-muted-foreground text-sm">
                    When enabled, users must fill out this field before they can submit their ticket. Required
                    fields cannot be left empty.
                  </p>
                </div>
                <Dialog.Footer>
                  <Button type="submit">Save</Button>
                </Dialog.Footer>
              </form>
            </Dialog.Content>
          </Dialog.Root>
        {/if}
      </Card.Content>
    </Card.Root>

    <Dialog.Root
      bind:open={dialogState.edit}
      onOpenChangeComplete={(opn) => {
        if (!opn) {
          editField.data = null;
        }
      }}
    >
      <Dialog.Content class="gap-6">
        <Dialog.Header>
          <Dialog.Title>Edit field</Dialog.Title>
        </Dialog.Header>

        {#if editField.data}
          <form
            class="flex flex-col gap-6"
            onsubmit={(e) => {
              e.preventDefault();
              saveField("edit");
            }}
          >
            <div class="flex w-full max-w-sm flex-col gap-1.5">
              <Label for="edit-label">Label</Label>
              <Input
                required
                type="text"
                id="edit-label"
                bind:value={editField.data.label}
                placeholder="The question to ask"
                minlength={3}
                maxlength={45}
              />
            </div>

            <div class="flex w-full max-w-sm flex-col gap-1.5">
              <Label for="edit-ph">Placeholder</Label>
              <Input
                type="text"
                id="edit-ph"
                bind:value={editField.data.placeholder}
                placeholder="The placeholder to show"
                minlength={0}
                maxlength={100}
              />
            </div>

            <div class="flex w-full max-w-sm flex-col gap-1.5">
              <Label for="edit-style">Style</Label>
              <RadioGroup.Root
                bind:value={
                  () => (editField.data!.style === 1 ? "short" : "long"),
                  (v: "short" | "long") => (editField.data!.style = v === "short" ? 1 : 2)
                }
              >
                <div class="flex items-center space-x-2">
                  <RadioGroup.Item value="short" id="edit-style-short" />
                  <Label for="edit-style-short">Short (One Line)</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroup.Item value="long" id="edit-style-long" />
                  <Label for="edit-style-long">Paragraph (Multiline)</Label>
                </div>
              </RadioGroup.Root>
            </div>

            <div class="flex w-full max-w-sm flex-col gap-1.5">
              <div class="flex w-full max-w-sm flex-col gap-1">
                <Label>Minimum Input Length</Label>
                <Input type="number" min={0} max={4000} bind:value={editField.data.minL} />
              </div>
              <div class="flex w-full max-w-sm flex-col gap-1">
                <Label>Maximum Input Length</Label>
                <Input type="number" min={1} max={4000} bind:value={editField.data.maxL} />
              </div>
            </div>

            <div class="flex w-full max-w-sm flex-col gap-1.5">
              <Label for="edit-required">
                <Checkbox bind:checked={editField.data._required} id="edit-required" />
                Required
              </Label>
              <p class="text-muted-foreground text-sm">
                When enabled, users must fill out this field before they can submit their ticket. Required
                fields cannot be left empty.
              </p>
            </div>
            <Dialog.Footer>
              <Button type="submit">Save</Button>
            </Dialog.Footer>
          </form>
        {/if}
      </Dialog.Content>
    </Dialog.Root>

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
