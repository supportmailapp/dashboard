<script lang="ts">
  import type {
    AnyAPIFormComponent,
    APIFormComponent,
    FormComponentKeys,
    ClientStringSelectOption,
    ModalComponentType,
    IStringSelectComponent,
    ITextInputComponent,
  } from "$lib/sm-types";
  import { SnowflakeUtil } from "$lib/utils";
  import Badge from "$ui/badge/badge.svelte";
  import { Button } from "$ui/button/index.js";
  import Checkbox from "$ui/checkbox/checkbox.svelte";
  import * as Dialog from "$ui/dialog/index.js";
  import { Input } from "$ui/input/index.js";
  import { Label } from "$ui/label/index.js";
  import * as RadioGroup from "$ui/radio-group/index.js";
  import * as Select from "$ui/select/index.js";
  import Textarea from "$ui/textarea/textarea.svelte";
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash from "@lucide/svelte/icons/trash";
  import { ComponentType, TextInputStyle } from "discord-api-types/v10";
  import { flip } from "svelte/animate";
  import OptionDialog from "./OptionDialog.svelte";

  type RequireableFormComponent = Extract<AnyAPIFormComponent, { required?: boolean }>;
  type Props<T extends ModalComponentType = ModalComponentType> = {
    field: APIFormComponent<T> | null;
    open: boolean;
    saveBtnLabel?: string;
    availableTypes?: T[];
    onSave?: (_field: APIFormComponent<T>) => void;
  };

  let {
    field = $bindable(null),
    open = $bindable(false),
    saveBtnLabel = "Save",
    availableTypes,
    onSave,
  }: Props = $props();
  let optionDialogOpen = $state(false);
  let editingOption = $state<ClientStringSelectOption | null>(null);

  // Default to all types if not specified
  const allTypes: ModalComponentType[] = [
    ComponentType.TextDisplay,
    ComponentType.TextInput,
    ComponentType.StringSelect,
    ComponentType.FileUpload,
  ];

  const effectiveAvailableTypes = $derived(availableTypes ?? allTypes);

  function addOption() {
    if (!field || field.type !== ComponentType.StringSelect) return;
    const newOption: ClientStringSelectOption = {
      local: true,
      _id: new Date().toISOString(),
      label: `Option ${((field.options ?? []).length || 0) + 1}`,
      value: `value-${((field.options ?? []).length || 0) + 1}`,
      description: "",
      emoji: "",
      default: false,
    };
    field.options = [...(field.options ?? []), newOption];
    editingOption = newOption;
    optionDialogOpen = true;
  }

  function editOption(option: ClientStringSelectOption) {
    editingOption = { ...option };
    optionDialogOpen = true;
  }

  function moveOptionUp(index: number) {
    if (field?.type !== ComponentType.StringSelect) return;
    if (!field || index === 0 || !field.options) return;
    const newOptions = [...field.options];
    [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
    field.options = newOptions;
  }

  function moveOptionDown(index: number) {
    if (field?.type !== ComponentType.StringSelect) return;
    if (!field || !field.options || index === field.options.length - 1) return;
    const newOptions = [...field.options];
    [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    field.options = newOptions;
  }

  function upsertOption(option: ClientStringSelectOption) {
    if (field?.type !== ComponentType.StringSelect) return;
    if (!field) return;
    if (!field.options) field.options = [];
    const idx = field.options.findIndex((o) => o._id === option._id);
    if (idx === -1) {
      field.options = [...field.options, option];
    } else {
      field.options[idx] = option;
    }
  }

  const fieldLabels = {
    [ComponentType.TextDisplay]: "Text Display",
    [ComponentType.TextInput]: "Text Input",
    [ComponentType.StringSelect]: "Select Menu",
    [ComponentType.FileUpload]: "File Upload",
  };

  function switchFieldType<NewType extends ModalComponentType>(
    newType: NewType,
  ): NonNullable<Props["field"]> {
    const oldField = $state.snapshot(field);
    // preserve id/local (or generate an id if this is a fresh field) so parent can identify the field after switching types
    const base = {
      id: typeof oldField?.id === "string" ? oldField.id : SnowflakeUtil.generate().toString(),
      local: oldField?.local === true || undefined,
    };
    function getOldOrDefault<T>(key: FormComponentKeys, defaultVal: T): T {
      const val = oldField?.[key as keyof typeof oldField] ?? undefined;
      if (val === undefined || val === null) return defaultVal;
      return val as T;
    }
    switch (newType) {
      case ComponentType.TextDisplay:
        return {
          ...base,
          type: newType,
          content: "Hello World",
        };
      case ComponentType.TextInput:
        return {
          ...base,
          type: newType,
          label: getOldOrDefault("label", "New Text Input"),
          style: 1,
          placeholder: getOldOrDefault("placeholder", ""),
          required: getOldOrDefault("required", false),
          minLength: 0,
          maxLength: 4000,
        };
      case ComponentType.StringSelect:
        return {
          ...base,
          type: newType,
          label: getOldOrDefault("label", "New Select Menu"),
          placeholder: getOldOrDefault("placeholder", ""),
          required: getOldOrDefault("required", false),
          minValues: getOldOrDefault("minValues", 0),
          maxValues: getOldOrDefault("maxValues", 1),
          options: [],
        };
      case ComponentType.FileUpload:
        return {
          ...base,
          type: newType,
          label: getOldOrDefault("label", "New File Upload"),
          required: getOldOrDefault("required", false),
          minValues: getOldOrDefault("minValues", 0),
          maxValues: getOldOrDefault("maxValues", 1),
        };
    }

    throw new Error("Unsupported field type. How tf did you get here?");
  }

  function handleFieldTypeChange(newTypeValue: string) {
    const newType = Number(newTypeValue) as ModalComponentType;
    // prevent switching to a type that's not available
    if (!effectiveAvailableTypes.includes(newType)) return;
    const newField = switchFieldType(newType);
    field = { ...newField };
  }

  // Filter field labels to only show available types, or include current field type if editing
  let selectableTypes = $derived(
    Object.entries(fieldLabels).filter(([typeValue]) => {
      const t = Number(typeValue) as ModalComponentType;
      return effectiveAvailableTypes.includes(t) || (field && field.type === t);
    }),
  );

  let fieldTypeSelectOpen = $state(false);
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="gap-6" interactOutsideBehavior="ignore" escapeKeydownBehavior="ignore">
    <Dialog.Header>
      <Dialog.Title>Edit field</Dialog.Title>
    </Dialog.Header>

    {#if field}
      <form
        class="flex flex-col gap-6"
        onsubmit={(e) => {
          e.preventDefault();
          if (!field) return;
          onSave?.(field);
        }}
      >
        <div class="flex w-full max-w-sm flex-col gap-1.5">
          <Label for="edit-type">Field Type</Label>
          <Select.Root
            type="single"
            bind:open={fieldTypeSelectOpen}
            bind:value={() => field!.type.toString(), (v) => handleFieldTypeChange(v)}
          >
            <Select.Trigger id="edit-type" class="w-full">{fieldLabels[field.type]}</Select.Trigger>
            <Select.Content class="max-h-60 w-full overflow-y-auto">
              {#each selectableTypes as [typeValue, typeLabel]}
                <Select.Item
                  value={typeValue}
                  class="cursor-pointer"
                  onselect={() => {
                    const newField = switchFieldType(Number(typeValue) as ModalComponentType);
                    field = { ...newField };
                  }}
                >
                  {typeLabel}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>

        {#if field.type === ComponentType.TextDisplay}
          <div class="flex w-full max-w-sm flex-col gap-1.5">
            <Label for="edit-content">Content</Label>
            <Textarea id="edit-content" rows={4} bind:value={field.content} class="rounded-md border p-2" />
          </div>
        {/if}

        {#if field.type !== ComponentType.TextDisplay}
          <div class="flex w-full max-w-sm flex-col gap-1.5">
            <Label for="edit-label">Label</Label>
            <Input
              required
              type="text"
              id="edit-label"
              bind:value={field.label}
              placeholder="The question to ask"
              minlength={3}
              maxlength={45}
            />
          </div>

          <div class="flex w-full max-w-sm flex-col gap-1.5">
            <Label for="edit-description">Description</Label>
            <Input
              type="text"
              id="edit-description"
              bind:value={field.description}
              placeholder="A short description for this field"
              minlength={1}
              maxlength={100}
            />
          </div>

          {#if field.type !== ComponentType.FileUpload}
            <div class="flex w-full max-w-sm flex-col gap-1.5">
              <Label for="edit-ph">Placeholder</Label>
              <Input
                type="text"
                id="edit-ph"
                bind:value={field.placeholder}
                placeholder="The placeholder to show"
                minlength={0}
                maxlength={100}
              />
            </div>
          {/if}
        {/if}

        {#if field.type === ComponentType.TextInput}
          <div class="flex w-full max-w-sm flex-col gap-1.5">
            <Label for="edit-style">Style</Label>
            <RadioGroup.Root
              bind:value={
                () => (field as ITextInputComponent).style.toString(),
                (v) => ((field as ITextInputComponent).style = Number(v))
              }
            >
              <div class="flex items-center space-x-2">
                <RadioGroup.Item value="1" id="edit-style-short" />
                <Label for="edit-style-short">Short (One Line)</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroup.Item value="2" id="edit-style-long" />
                <Label for="edit-style-long">Paragraph (Multiline)</Label>
              </div>
            </RadioGroup.Root>
          </div>
        {/if}

        {#if field.type === ComponentType.TextInput}
          <div class="flex w-full max-w-sm flex-row gap-1.5">
            <div class="flex w-full max-w-sm flex-col gap-1">
              <Label>Minimum Input Length</Label>
              <Input type="number" min={0} max={4000} bind:value={field.minLength} />
            </div>
            <div class="flex w-full max-w-sm flex-col gap-1">
              <Label>Maximum Input Length</Label>
              <Input type="number" min={1} max={4000} bind:value={field.maxLength} />
            </div>
          </div>
        {/if}

        {#if field.type === ComponentType.StringSelect || field.type === ComponentType.FileUpload}
          {@const minLabel = field.type === ComponentType.FileUpload ? "Minimum Files" : "Minimum Selections"}
          {@const maxLabel = field.type === ComponentType.FileUpload ? "Maximum Files" : "Maximum Selections"}
          <div class="flex w-full max-w-sm flex-row gap-1.5">
            <div class="flex w-full max-w-sm flex-col gap-1">
              <Label>{minLabel}</Label>
              <Input type="number" min={0} max={4000} bind:value={field.minValues} />
            </div>
            <div class="flex w-full max-w-sm flex-col gap-1">
              <Label>{maxLabel}</Label>
              <Input type="number" min={1} max={4000} bind:value={field.maxValues} />
            </div>
          </div>

          {#if field.type === ComponentType.StringSelect}
            {@const options = field.options ?? []}
            <div class="mt-2 flex w-full max-w-sm flex-col gap-1.5">
              <Label>Options</Label>
              <div class="space-y-2">
                {#if options.length === 0}
                  <p class="text-muted-foreground text-sm">No options added. Add one to get started.</p>
                {:else}
                  <div class="flex flex-col gap-1">
                    {#each options as option, idx (option._id)}
                      <div
                        class="flex items-center gap-2 rounded border p-2"
                        animate:flip={{ duration: 200 }}
                      >
                        <Badge variant="outline" class="text-center">{idx + 1}</Badge>
                        <div class="flex-1">
                          <p class="font-medium">{option.label}</p>
                          <p class="text-muted-foreground text-sm">{option.value}</p>
                        </div>
                        <div class="flex gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            onclick={() => moveOptionUp(idx)}
                            disabled={idx === 0}><ArrowUp /></Button
                          >
                          <Button
                            size="icon"
                            variant="outline"
                            onclick={() => moveOptionDown(idx)}
                            disabled={idx === options.length - 1}><ArrowDown /></Button
                          >
                          <Button onclick={() => editOption(option)}><Pencil /></Button>
                          <Button
                            variant="destructive"
                            onclick={() => {
                              if (confirm("Delete this option?"))
                                (field as IStringSelectComponent).options = options.filter(
                                  (o) => o._id !== option._id,
                                );
                            }}><Trash /></Button
                          >
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}

                <Button
                  variant="outline"
                  class="mt-1"
                  onclick={() => addOption()}
                  disabled={options.length >= 25}
                >
                  <Plus /> Add Option
                </Button>
              </div>
            </div>
          {/if}
        {/if}

        {#if field.type !== ComponentType.TextDisplay}
          <div class="flex w-full max-w-sm flex-col gap-1.5">
            <Label for="edit-required">
              <Checkbox
                bind:checked={
                  () => (field as RequireableFormComponent).required ?? false,
                  (v) => ((field as RequireableFormComponent).required = !!v)
                }
                id="edit-required"
              />
              Required
            </Label>
            <p class="text-muted-foreground text-sm">
              When enabled, users must fill out this field before they can submit their ticket. Required
              fields cannot be left empty.
            </p>
          </div>
        {/if}

        {#if field.type === ComponentType.TextInput}
          <div class="flex w-full max-w-sm flex-col gap-1.5">
            <Label for="edit-content">Default Value</Label>
            {#if field.style === TextInputStyle.Short}
              <Input
                type="text"
                id="edit-content"
                bind:value={
                  () => (field as ITextInputComponent).defaultValue ?? "",
                  (v) => ((field as ITextInputComponent).defaultValue = v || "")
                }
                class="rounded-md border p-2"
              />
            {:else}
              <Textarea
                id="edit-content"
                rows={4}
                bind:value={
                  () => (field as ITextInputComponent).defaultValue ?? "",
                  (v) => ((field as ITextInputComponent).defaultValue = v || "")
                }
                class="rounded-md border p-2"
              />
            {/if}
          </div>
        {/if}

        <OptionDialog
          bind:option={editingOption}
          bind:open={optionDialogOpen}
          saveBtnLabel="Save"
          onSave={(opt: ClientStringSelectOption) => {
            upsertOption(opt);
            optionDialogOpen = false;
            editingOption = null;
          }}
        />

        <Dialog.Footer>
          <Button type="submit">{saveBtnLabel}</Button>
        </Dialog.Footer>
      </form>
    {/if}
  </Dialog.Content>
</Dialog.Root>
