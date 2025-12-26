<script lang="ts">
  import AreYouSureDialog from "$lib/components/AreYouSureDialog.svelte";
  import type { ICustomModalField, IFeedbackConfig } from "$lib/sm-types";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import { cn } from "$lib/utils";
  import { Badge } from "$ui/badge/index.js";
  import { Button, buttonVariants } from "$ui/button";
  import * as Card from "$ui/card/index.js";
  import { Checkbox } from "$ui/checkbox/index.js";
  import * as Dialog from "$ui/dialog/index.js";
  import { Input } from "$ui/input";
  import { Label } from "$ui/label";
  import * as RadioGroup from "$ui/radio-group/index.js";
  import { Switch } from "$ui/switch";
  import { Textarea } from "$ui/textarea/index.js";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Plus from "@lucide/svelte/icons/plus";
  import Save from "@lucide/svelte/icons/save";
  import Trash from "@lucide/svelte/icons/trash";
  import { slide } from "svelte/transition";

  type Props = {
    feedback: IFeedbackConfig;
    saveFn: SaveFunction;
    resetFn: () => Promise<void>;
    loading: boolean;
    saving: boolean;
  };
  let { feedback = $bindable(), saveFn, resetFn, loading: isLoading, saving: isSaving }: Props = $props();

  // Initialize fields array if it doesn't exist
  if (!feedback.questions) {
    feedback.questions = [];
  }

  const dialogState = $state({
    new: false,
    edit: false,
  });

  let highestPos = $derived(
    feedback.questions
      ? feedback.questions.reduce((acc, cur) => {
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

  // Field stuff
  function saveField(whichOne: "new" | "edit") {
    if (whichOne === "new") {
      feedback.questions!.push(newField.snap()!);
      dialogState.new = false;
      newField.setConfig(newField.backup);
    } else {
      // Find and update the existing field by position
      const fieldIndex = feedback.questions!.findIndex((f) => f.position === editField.config?.position);
      if (fieldIndex !== undefined && fieldIndex !== -1) {
        feedback.questions![fieldIndex] = editField.snap()!;
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
    if (!fieldReorderingEnabled || !feedback.questions) return;
    event.preventDefault();

    if (draggedField && draggedField.position !== dropIndex) {
      const newFields = [...feedback.questions];
      const draggedElement = newFields.splice(draggedField.position, 1)[0];
      newFields.splice(dropIndex, 0, draggedElement);

      // Update position values to match new order
      newFields.forEach((field, index) => {
        field.position = index + 1;
      });

      feedback.questions = newFields;
    }

    draggedOverIndex = -1;
  }
</script>

<div class="grid max-w-3xl grid-cols-1 gap-6">
  <Card.Root>
    <Card.Header>
      <Card.Title>Basic Settings</Card.Title>
    </Card.Header>
    <Card.Content class="space-y-5">
      <div class="flex items-center justify-between">
        <div class="space-y-0.5">
          <Label>Feedback Status</Label>
          <p class="text-muted-foreground text-sm">Enable or disable feedback collection for tickets.</p>
        </div>
        <Switch id="status" bind:checked={feedback.isEnabled} />
      </div>

      <div class="space-y-2">
        <Label>Thank You Response</Label>
        <Textarea
          class="max-h-40"
          placeholder="Type your message here."
          id="message"
          bind:value={feedback.thankYou}
        />
        <p class="text-muted-foreground text-sm">
          This message is displayed after a user submitted any feedback.
        </p>
      </div>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Title>Custom Feedback Fields</Card.Title>
      <Card.Description>Have up to 5 questions, the user is asked when providing feedback.</Card.Description>
    </Card.Header>
    <Card.Content class="space-y-2">
      {#if feedback.questions && feedback.questions.length > 0}
        {#if feedback.questions.length > 1}
          <div class="mb-4">
            <Label class="w-fit">
              <Checkbox bind:checked={fieldReorderingEnabled} />
              Enable field reordering
            </Label>
          </div>
        {/if}
        <ul class="flex max-w-2xl flex-col gap-1">
          {#each feedback.questions as field, index (field.position)}
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
                    editField.setConfig($state.snapshot(feedback.questions![index]));
                    dialogState.edit = true;
                  }}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="destructive"
                  onclick={() => {
                    if (confirm("Do you really want to delete this field?")) {
                      feedback.questions = feedback.questions!.filter((f) => f.position !== field.position);
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

      {#if !feedback.questions || feedback.questions.length < 5}
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

            {#if newField.isConfigured()}
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
                    bind:value={newField.config.label}
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
                    bind:value={newField.config.placeholder}
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
                      (v: "short" | "long") => (newField.config.style = v === "short" ? 1 : 2)
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
                    <Input type="number" min={0} max={4000} bind:value={newField.config.minL} />
                  </div>
                  <div class="flex w-full max-w-sm flex-col gap-1">
                    <Label>Maximum Input Length</Label>
                    <Input type="number" min={1} max={4000} bind:value={newField.config.maxL} />
                  </div>
                </div>

                <div class="flex w-full max-w-sm flex-col gap-1.5">
                  <Label for="new-required">
                    <Checkbox bind:checked={newField.config._required} id="new-required" />
                    Required
                  </Label>
                  <p class="text-muted-foreground text-sm">
                    When enabled, users must fill out this field before they can submit their feedback.
                    Required fields cannot be left empty.
                  </p>
                </div>
                <Dialog.Footer>
                  <Button type="submit">Save</Button>
                </Dialog.Footer>
              </form>
            {/if}
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
              When enabled, users must fill out this field before they can submit their feedback. Required
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

  <Card.Root>
    <Card.Header>
      <Card.Title>Actions</Card.Title>
    </Card.Header>
    <Card.Content>
      <div class="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <AreYouSureDialog
          title="Are you absolutely sure?"
          description="Are you sure you want to reset feedback completely? This action cannot be undone."
          onYes={resetFn}
          disabled={isLoading}
        >
          <div
            class={buttonVariants({
              variant: "destructive",
              class: "sm:w-auto",
            })}
          >
            <Trash class="mr-2 h-4 w-4" />
            Reset
          </div>
        </AreYouSureDialog>

        <Button
          onclick={() => saveFn(() => {})}
          disabled={isLoading}
          class="sm:w-auto"
          showLoading={isSaving}
        >
          {#if isLoading}
            Saving...
          {:else}
            <Save class="mr-0.5 size-4" />
            Save Changes
          {/if}
        </Button>
      </div>
    </Card.Content>
  </Card.Root>
</div>
