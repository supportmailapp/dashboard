<script lang="ts">
  import type {
    APIFormComponent,
    FormComponentKeys,
    IStringSelectOption,
    ModalComponentType,
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
  let editingOption = $state<IStringSelectOption | null>(null);

  // Default to all types if not specified
  const allTypes: ModalComponentType[] = [
    ComponentType.TextDisplay,
    ComponentType.TextInput,
    ComponentType.StringSelect,
    ComponentType.File,
  ];

  const effectiveAvailableTypes = $derived(availableTypes ?? allTypes);

  function addOption() {
    if (!field) return;
    const newOption: IStringSelectOption = {
      id: SnowflakeUtil.generate().toString(),
      label: `Option ${(((field as any).options ?? []).length || 0) + 1}`,
      value: `value-${(((field as any).options ?? []).length || 0) + 1}`,
      description: "",
      emoji: "",
      default: false,
    };
    (field as any).options = [...((field as any).options ?? []), newOption];
    editingOption = newOption;
    optionDialogOpen = true;
  }

  function editOption(option: IStringSelectOption) {
    editingOption = { ...option };
    optionDialogOpen = true;
  }

  function moveOptionUp(index: number) {
    if (!field || index === 0 || !(field as any).options) return;
    const newOptions = [...(field as any).options];
    [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
    (field as any).options = newOptions;
  }

  function moveOptionDown(index: number) {
    if (!field || !(field as any).options || index === (field as any).options.length - 1) return;
    const newOptions = [...(field as any).options];
    [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    (field as any).options = newOptions;
  }

  function upsertOption(option: IStringSelectOption) {
    if (!field) return;
    if (!(field as any).options) (field as any).options = [];
    const idx = (field as any).options.findIndex((o: any) => o.id === option.id);
    if (idx === -1) {
      (field as any).options = [...(field as any).options, option];
    } else {
      (field as any).options[idx] = option;
    }
  }

  const fieldLabels = {
    [ComponentType.TextDisplay]: "Text Display",
    [ComponentType.TextInput]: "Text Input",
    [ComponentType.StringSelect]: "Select Menu",
    [ComponentType.File]: "File Upload",
  };

  function switchFieldType<NewType extends ModalComponentType>(
    newType: NewType,
  ): NonNullable<Props["field"]> {
    const oldField = $state.snapshot(field as any);
    // preserve id/local (or generate an id if this is a fresh field) so parent can identify the field after switching types
    const base = {
      id: typeof oldField.id === "string" ? oldField.id : SnowflakeUtil.generate().toString(),
      local: oldField.local === true || undefined,
    };
    function getOldOrDefault<T>(key: FormComponentKeys, defaultVal: T): T {
      const val = oldField[key];
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
          label: getOldOrDefault<string>("label", "New Text Input"),
          style: 1,
          placeholder: getOldOrDefault<string>("placeholder", ""),
          required: getOldOrDefault<boolean>("required", false),
          minLength: 0,
          maxLength: 4000,
        };
      case ComponentType.StringSelect:
        return {
          ...base,
          type: newType,
          label: getOldOrDefault<string>("label", "New Select Menu"),
          placeholder: getOldOrDefault<string>("placeholder", ""),
          required: getOldOrDefault<boolean>("required", false),
          minValues: getOldOrDefault<number>("minValues", 0),
          maxValues: getOldOrDefault<number>("maxValues", 1),
          options: [],
        };
      case ComponentType.File:
        return {
          ...base,
          type: newType,
          label: getOldOrDefault<string>("label", "New File Upload"),
          required: getOldOrDefault<boolean>("required", false),
          minValues: getOldOrDefault<number>("minValues", 0),
          maxValues: getOldOrDefault<number>("maxValues", 1),
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

          {#if field.type !== ComponentType.File}
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
              bind:value={() => (field as any).style.toString(), (v) => ((field as any).style = Number(v))}
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

        {#if field.type === ComponentType.StringSelect || field.type === ComponentType.File}
          {@const minLabel = field.type === ComponentType.File ? "Minimum Files" : "Minimum Selections"}
          {@const maxLabel = field.type === ComponentType.File ? "Maximum Files" : "Maximum Selections"}
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
            {@const options = (field as any).options ?? []}
            <div class="mt-2 flex w-full max-w-sm flex-col gap-1.5">
              <Label>Options</Label>
              <div class="space-y-2">
                {#if options.length === 0}
                  <p class="text-muted-foreground text-sm">No options added. Add one to get started.</p>
                {:else}
                  <div class="flex flex-col gap-1">
                    {#each options as option, idx (option.id)}
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
                                (field as any).options = options.filter((o: any) => o.id !== option.id);
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
                bind:checked={() => (field as any).required ?? false, (v) => ((field as any).required = v)}
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
                bind:value={field.defaultValue}
                class="rounded-md border p-2"
              />
            {:else}
              <Textarea
                id="edit-content"
                rows={4}
                bind:value={field.defaultValue}
                class="rounded-md border p-2"
              />
            {/if}
          </div>
        {/if}

        <OptionDialog
          bind:option={editingOption}
          bind:open={optionDialogOpen}
          saveBtnLabel="Save"
          onSave={(opt: IStringSelectOption) => {
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
