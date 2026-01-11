<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
  import { tick } from "svelte";
  import * as Command from "$lib/components/ui/command/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { cn } from "$lib/utils.js";
  import type { ClassValue } from "clsx";

  interface Props {
    /**
     * Label for the combobox trigger button
     */
    label?: string;
    /**
     * Whether to close the combobox popover when an option is selected
     *
     * @default false
     */
    closeOnSelect?: boolean;
    /**
     * Enable single-select mode (only one value can be selected at a time)
     *
     * @default false
     */
    single?: boolean;
    /**
     * Options to display in the combobox
     */
    options: { label: string; value: string }[];
    /**
     * Currently selected values
     */
    selected?: string[];
    /**
     * Callback when an option is selected
     */
    onSelect?: (value: string) => void;
    /**
     * Custom filter function for searching options
     */
    filter?: (commandValue: string, search: string, commandKeywords?: string[]) => number;
    popoverContentClass?: ClassValue;
    commandClass?: ClassValue;
    commandInputClass?: ClassValue;
    commandListClass?: ClassValue;
    commandItemClass?: ClassValue;
  }

  let {
    label = "Select...",
    closeOnSelect = false,
    single: singleSelect = false,
    options,
    selected = $bindable([]),
    onSelect,
    filter,
    popoverContentClass,
    commandClass,
    commandInputClass,
    commandListClass,
    commandItemClass = "",
  }: Props = $props();

  let open = $state(false);
  let triggerRef = $state<HTMLButtonElement | null>(null);

  async function closeAndFocusTrigger() {
    open = false;
    await tick();
    triggerRef?.focus();
  }

  // toggle selection and notify consumer
  function toggleSelect(value: string) {
    if (singleSelect) {
      // In single-select mode, replace the selection
      selected = [value];
    } else {
      // In multi-select mode, toggle the value
      const idx = selected.indexOf(value);
      if (idx === -1) {
        selected = [...selected, value];
      } else {
        selected = selected.filter((v) => v !== value);
      }
    }
    onSelect?.(value);
    if (closeOnSelect) closeAndFocusTrigger();
  }

  function isSelected(value: string) {
    return selected.includes(value);
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger bind:ref={triggerRef}>
    {#snippet child({ props })}
      <Button {...props} variant="outline" class="w-80 justify-between" role="combobox" aria-expanded={open}>
        {label}
        <ChevronsUpDownIcon class="ms-2 size-4 shrink-0 opacity-50" />
      </Button>
    {/snippet}
  </Popover.Trigger>

  <Popover.Content class={cn("w-80 p-0", popoverContentClass)}>
    <Command.Root class={cn("bg-background", commandClass)} {filter}>
      <Command.Input class={cn(commandInputClass)} placeholder="Search..." />
      <Command.List class={cn(commandListClass)}>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group>
          {#each options as option (option.value)}
            <Command.Item
              value={option.value}
              onSelect={() => toggleSelect(option.value)}
              class={commandItemClass as string}
            >
              <CheckIcon class={cn("me-2 size-4", !isSelected(option.value) && "text-transparent")} />
              {option.label}
            </Command.Item>
          {/each}
        </Command.Group>
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
