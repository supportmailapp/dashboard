<script lang="ts">
  import type { SvelteBitfield } from "$lib/utils/reactiveBitfield.svelte";
  import { Input } from "$ui/input/index.js";
  import { Label } from "$ui/label/index.js";
  import * as Select from "$ui/select/index.js";
  import * as Dropdown from "$ui/dropdown-menu/index.js";
  import { BlacklistScope, EntityType } from "supportmail-types";
  import Check from "@lucide/svelte/icons/check";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import { cn } from "$lib/utils";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import Info from "@lucide/svelte/icons/info";

  type Props = {
    search: string;
    scopes: SvelteBitfield;
    perPage: number;
    filterType: Exclude<EntityType, EntityType.guild> | -1;
    sorting: "newestFirst" | "oldestFirst";
  };

  let {
    search = $bindable(""),
    scopes = $bindable(),
    perPage = $bindable(20),
    filterType = $bindable(-1),
    sorting = $bindable("newestFirst"),
  }: Props = $props();

  const filterScopeOptions: { value: BlacklistScope; label: string }[] = [
    { value: BlacklistScope.tickets, label: "Tickets" },
    { value: BlacklistScope.reports, label: "Reports" },
    { value: BlacklistScope.tags, label: "Tags" },
  ];

  const filterTypeOptions: { value: Exclude<EntityType, EntityType.guild> | -1; label: string }[] = [
    { value: -1, label: "All" },
    { value: EntityType.user, label: "User" },
    { value: EntityType.role, label: "Role" },
  ];
</script>

<div class="bg-card flex w-full max-w-3xl flex-wrap gap-3 rounded-lg border p-4">
  <div class="flex w-full max-w-xs flex-col gap-2">
    <Label class="text-sm font-medium">Search</Label>
    <Input
      placeholder={filterType === -1
        ? "User / Role ID"
        : filterType === EntityType.user
          ? "User ID"
          : "Role ID"}
      bind:value={search}
      class="w-full"
    />
  </div>

  <div class="flex flex-col gap-2">
    <Label class="text-sm font-medium">Filter By Type</Label>
    <Select.Root
      type="single"
      bind:value={() => filterType.toString(), (v) => (filterType = parseInt(v, 10))}
    >
      <Select.Trigger class="w-32">
        {filterTypeOptions.find((opt) => opt.value === filterType)?.label || "Filter By ..."}
      </Select.Trigger>
      <Select.Content align="center">
        {#each filterTypeOptions as opt}
          <Select.Item value={opt.value.toString()}>
            {opt.label}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>

  <div class="flex flex-col gap-2">
    <Label class="text-sm font-medium">
      Filter By Scope
      <Tooltip.Provider delayDuration={100} disableCloseOnTriggerClick>
        <Tooltip.Root>
          <Tooltip.Trigger class="cursor-help">
            <Info class="size-3.5" />
          </Tooltip.Trigger>
          <Tooltip.Content class="max-w-60">
            <p>
              Shows results where at least one selected scope matches.<br />
              Example: If you filter for <strong>Tickets</strong> and <strong>Reports</strong>, you'll also
              see entries that only have
              <strong>Tickets</strong>
              or only
              <strong>Reports</strong>.<br />
              If you filter only for <strong>Tickets</strong>, you'll also see entries that have more scopes
              than just <strong>Tickets</strong>.
            </p>
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    </Label>
    <Dropdown.Root>
      <Dropdown.Trigger
        class={cn(
          "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none select-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          "w-full sm:w-50",
        )}
      >
        Select Scopes
        <ChevronDown class="size-4 opacity-50" />
      </Dropdown.Trigger>
      <Dropdown.Content class="w-50">
        <Dropdown.Group>
          {#each filterScopeOptions as _scope}
            <Dropdown.Item
              closeOnSelect={false}
              onclick={() => {
                console.log("toggled scope", _scope.value);
                scopes.toggle(_scope.value);
              }}
            >
              {#if scopes.has(_scope.value)}
                <span class="absolute right-2 flex size-3.5 items-center justify-center">
                  <Check class="size-4" />
                </span>
              {/if}
              {_scope.label}
            </Dropdown.Item>
          {/each}
        </Dropdown.Group>
      </Dropdown.Content>
    </Dropdown.Root>
  </div>

  <div class="flex flex-col gap-2">
    <Label class="text-sm font-medium">Per Page</Label>
    <Select.Root type="single" bind:value={() => perPage.toString(), (v) => (perPage = parseInt(v, 10))}>
      <Select.Trigger class="w-20">{perPage}</Select.Trigger>
      <Select.Content>
        <Select.Item value="20">20</Select.Item>
        <Select.Item value="50">50</Select.Item>
        <Select.Item value="100">100</Select.Item>
      </Select.Content>
    </Select.Root>
  </div>

  <div class="flex flex-col gap-2">
    <Label class="text-sm font-medium">Sort By</Label>
    <Select.Root type="single" bind:value={() => sorting, (v) => (sorting = v)}>
      <Select.Trigger class="w-32">
        {sorting === "newestFirst" ? "Newest First" : "Oldest First"}
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="newestFirst">Newest First</Select.Item>
        <Select.Item value="oldestFirst">Oldest First</Select.Item>
      </Select.Content>
    </Select.Root>
  </div>
</div>
