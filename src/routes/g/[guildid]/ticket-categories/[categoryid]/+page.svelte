<script lang="ts">
  import { goto, invalidate } from "$app/navigation";
  import { page } from "$app/state";
  import Mention from "$lib/components/discord/Mention.svelte";
  import EmojiInput from "$lib/components/EmojiInput.svelte";
  import MentionableSelect from "$lib/components/MentionableSelect.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import * as Table from "$lib/components/ui/table/index.js";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import { APIRoutes } from "$lib/urls.js";
  import { cn } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient.js";
  import * as AlertDialog from "$ui/alert-dialog/index.js";
  import { Button, buttonVariants } from "$ui/button";
  import * as Card from "$ui/card/index.js";
  import { Checkbox } from "$ui/checkbox/index.js";
  import * as Dialog from "$ui/dialog/index.js";
  import { Input } from "$ui/input";
  import { Label } from "$ui/label";
  import * as Popover from "$ui/popover/index.js";
  import * as RadioGroup from "$ui/radio-group/index.js";
  import { Switch } from "$ui/switch";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Plus from "@lucide/svelte/icons/plus";
  import Save from "@lucide/svelte/icons/save";
  import Trash from "@lucide/svelte/icons/trash";
  import equal from "fast-deep-equal/es6";
  import { EntityType, type ICustomModalField, type ITicketCategory } from "supportmail-types";
  import { toast } from "svelte-sonner";
  import { slide } from "svelte/transition";
  import { Badge } from "$ui/badge/index.js";
  import AreYouSureDialog from "$lib/components/AreYouSureDialog.svelte";

  let { data } = $props();

  const category = new ConfigState(
    data.category ? { ...data.category, emoji: data.category.emoji ?? { name: "" } } : null,
    !data.category,
  );
  const dialogState = $state({
    new: false,
    edit: false,
  });
  let highestPos = $derived(
    category.config
      ? category.config.fields.reduce((acc, cur) => {
          if (cur.position > acc) return cur.position;
          return acc;
        }, 0) + 1
      : 1,
  );

  const newField = new ConfigState<Required<ICustomModalField>>({
    label: "",
    placeholder: "",
    minL: 0,
    maxL: 100,
    position: 1,
    style: 1,
    _required: false,
  });
  const editField = new ConfigState<ICustomModalField>();

  $effect(() => {
    if (highestPos !== newField.config!.position) {
      newField.config!.position = highestPos;
    }
  });

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

    const payload = category.snap() as DocumentWithId<ITicketCategory>;
    if (payload && payload.emoji?.name === "") {
      payload.emoji = undefined;
    }

    try {
      const res = await apiClient.put(APIRoutes.ticketCategory(page.data.guildId!, categoryId), {
        json: payload,
      });

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to save ticket category.");
      }

      await res.json<DocumentWithId<Omit<ITicketCategory, "_id" | "__v">>>();
      toast.success("Ticket category saved successfully.");
      category.loading = false;
      invalidate("ticket-category-" + page.params.categoryid);
    } catch (error: any) {
      toast.error(`Failed to save ticket category: ${error.message}`);
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

  // Field stuff
  function saveField(whichOne: "new" | "edit") {
    if (whichOne === "new") {
      category.config?.fields.push(newField.snap()!);
      dialogState.new = false;
      newField.setConfig(newField.backup);
    } else {
      // Find and update the existing field by position
      const fieldIndex = category.config?.fields.findIndex((f) => f.position === editField.config?.position);
      if (fieldIndex !== undefined && fieldIndex !== -1 && category.config) {
        category.config.fields[fieldIndex] = editField.snap()!;
      }
      dialogState.edit = false;
    }
  }

  // Field reordering state
  let fieldReorderingEnabled = $state(false);
  let draggedField: ICustomModalField | null = $state(null);
  let draggedOverIndex = $state(-1);

  // Field reordering handlers
  type MyDragEvent = DragEvent & {
    currentTarget: EventTarget & HTMLLIElement;
  };

  function handleFieldDragStart(event: MyDragEvent, field: ICustomModalField, index: number) {
    if (!fieldReorderingEnabled) {
      event.preventDefault();
      return;
    }
    if (!event.dataTransfer) return;

    draggedField = { ...field, position: index };
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/html", event.currentTarget.outerHTML);
    event.currentTarget.style.opacity = "0.5";
  }

  function handleFieldDragEnd(event: MyDragEvent) {
    event.currentTarget.style.opacity = "1";
    draggedField = null;
    draggedOverIndex = -1;
  }

  function handleFieldDragOver(event: any, index: number) {
    if (!fieldReorderingEnabled) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    draggedOverIndex = index;
  }

  function handleFieldDragLeave() {
    draggedOverIndex = -1;
  }

  function handleFieldDrop(event: MyDragEvent, dropIndex: number) {
    if (!fieldReorderingEnabled || !category.config) return;
    event.preventDefault();

    if (draggedField && draggedField.position !== dropIndex) {
      const newFields = [...category.config.fields];
      const draggedElement = newFields.splice(draggedField.position, 1)[0];
      newFields.splice(dropIndex, 0, draggedElement);

      // Update position values to match new order
      newFields.forEach((field, index) => {
        field.position = index + 1;
      });

      category.config.fields = newFields;
    }

    draggedOverIndex = -1;
  }

  // ...existing code...
</script>

<div class="container max-w-4xl space-y-6">
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

    <Card.Root>
      <Card.Header>
        <Card.Title>Custom Modal Fields</Card.Title>
        <Card.Description>
          Have up to 5 questions, the user is asked before creating a ticket.
        </Card.Description>
      </Card.Header>
      <Card.Content class="space-y-2">
        {#if category.config.fields.length > 0}
          <div class="mb-4">
            <Label class="w-fit">
              <Checkbox bind:checked={fieldReorderingEnabled} />
              Enable field reordering
            </Label>
          </div>
          <ul class="flex max-w-2xl flex-col gap-1">
            {#each category.config.fields as field, index (field.position)}
              <li
                class={cn(
                  "bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/70 flex h-16 flex-row items-center gap-3 rounded border p-3 shadow-xs transition duration-100 select-none",
                  draggedOverIndex === index && "border-primary dark:border-primary scale-101 border-2",
                  fieldReorderingEnabled ? "cursor-grab hover:-translate-y-0.5" : "cursor-default",
                )}
                draggable={fieldReorderingEnabled}
                ondragstart={(event) => handleFieldDragStart(event, field, index)}
                ondragend={handleFieldDragEnd}
                ondragover={(event) => handleFieldDragOver(event, index)}
                ondragleave={handleFieldDragLeave}
                ondrop={(event) => handleFieldDrop(event, index)}
              >
                {#if fieldReorderingEnabled}
                  <span
                    class="drag-handle text-muted-foreground"
                    transition:slide={{ duration: 150, axis: "x" }}>⋮⋮</span
                  >
                {/if}
                <Badge variant="outline">{field.position}</Badge>
                <span>{field.label}</span>
                {#if !fieldReorderingEnabled}
                  <Button
                    class="ml-auto"
                    onclick={() => {
                      editField.setConfig($state.snapshot(category.config.fields[index]));
                      dialogState.edit = true;
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="destructive"
                    onclick={() => {
                      if (confirm("Do you really want to delete this field?")) {
                        category.config!.fields = category
                          .snap()!
                          .fields.filter((f) => f.position !== field.position);
                      }
                    }}
                  >
                    <Trash />
                  </Button>
                {/if}
              </li>
            {/each}
          </ul>
        {:else}
          <p class="text-muted-foreground mb-3 text-sm">No fields added.</p>
        {/if}

        {#if category.config.fields.length < 5}
          <Dialog.Root
            bind:open={dialogState.new}
            onOpenChangeComplete={(opn) => {
              if (!opn) {
                newField.saveConfig({
                  ...newField.backup!,
                });
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
                    bind:value={newField.config!.label}
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
                    bind:value={newField.config!.placeholder}
                    placeholder="The placeholder to show"
                    minlength={0}
                    maxlength={100}
                  />
                </div>

                <div class="flex w-full max-w-sm flex-col gap-1.5">
                  <Label for="new-style">Style</Label>
                  <RadioGroup.Root
                    bind:value={
                      () => (newField.config!.style === 1 ? "short" : "long"),
                      (v: "short" | "long") => (newField.config!.style = v === "short" ? 1 : 2)
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
                    <Input type="number" min={0} max={4000} bind:value={newField.config!.minL} />
                  </div>
                  <div class="flex w-full max-w-sm flex-col gap-1">
                    <Label>Maximum Input Length</Label>
                    <Input type="number" min={1} max={4000} bind:value={newField.config!.maxL} />
                  </div>
                </div>

                <div class="flex w-full max-w-sm flex-col gap-1.5">
                  <Label for="new-required">
                    <Checkbox bind:checked={newField.config!._required} id="new-required" />
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
          editField.clear();
        }
      }}
    >
      <Dialog.Content class="gap-6">
        <Dialog.Header>
          <Dialog.Title>Edit field</Dialog.Title>
        </Dialog.Header>

        {#if editField.config}
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
                bind:value={editField.config.label}
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
                bind:value={editField.config.placeholder}
                placeholder="The placeholder to show"
                minlength={0}
                maxlength={100}
              />
            </div>

            <div class="flex w-full max-w-sm flex-col gap-1.5">
              <Label for="edit-style">Style</Label>
              <RadioGroup.Root
                bind:value={
                  () => (editField.config!.style === 1 ? "short" : "long"),
                  (v: "short" | "long") => (editField.config!.style = v === "short" ? 1 : 2)
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
                <Input type="number" min={0} max={4000} bind:value={editField.config.minL} />
              </div>
              <div class="flex w-full max-w-sm flex-col gap-1">
                <Label>Maximum Input Length</Label>
                <Input type="number" min={1} max={4000} bind:value={editField.config.maxL} />
              </div>
            </div>

            <div class="flex w-full max-w-sm flex-col gap-1.5">
              <Label for="edit-required">
                <Checkbox bind:checked={editField.config._required} id="edit-required" />
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
        <Card.Title>Danger Zone</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <AreYouSureDialog
            title="Are you absolutely sure?"
            description="Are you sure you want to delete <strong>{category.config
              .label}</strong>? This action cannot be undone."
            onYes={() => deleteCategory(category.config._id)}
            disabled={category.loading}
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
