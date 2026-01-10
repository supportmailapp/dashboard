<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
  import { tick } from "svelte";
  import * as Command from "$lib/components/ui/command/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { cn } from "$lib/utils.js";

  interface Props {
    label?: string;
    closeOnSelect?: boolean;
    options: { label: string; value: string }[];
    selected?: string[];
    onSelect?: (value: string) => void;
    filter?: (commandValue: string, search: string, commandKeywords?: string[]) => number;
  }

  let {
    label = "Select...",
    closeOnSelect = false,
    options,
    selected = $bindable([]),
    onSelect,
    filter,
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
    const idx = selected.indexOf(value);
    if (idx === -1) {
      selected = [...selected, value];
    } else {
      selected = [...selected.slice(0, idx), ...selected.slice(idx + 1)];
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

  <Popover.Content class="w-80 p-0">
    <Command.Root class="bg-background" {filter}>
      <Command.Input placeholder="Search..." />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group>
          {#each options as option (option.value)}
            <Command.Item value={option.value} onSelect={() => toggleSelect(option.value)}>
              <CheckIcon class={cn("me-2 size-4", !isSelected(option.value) && "text-transparent")} />
              {option.label}
            </Command.Item>
          {/each}
        </Command.Group>
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
