<script lang="ts">
  import { Input } from "$ui/input/index.js";
  import { Label } from "$ui/label/index.js";
  import * as Select from "$ui/select/index.js";
  import { BlacklistScope, EntityType } from "supportmail-types";

  type Props = {
    search?: string;
    scope?: Exclude<BlacklistScope, BlacklistScope.global>;
    perPage?: number;
    filterType?: Exclude<EntityType, EntityType.guild> | -1;
  };

  let {
    search = $bindable(""),
    scope = $bindable(BlacklistScope.all),
    perPage = $bindable(20),
    filterType = $bindable(-1),
  }: Props = $props();

  const filterScopeOptions: { value: BlacklistScope; label: string }[] = [
    { value: BlacklistScope.all, label: "All" },
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
    <Input placeholder="User / Role ID" bind:value={search} class="w-full" />
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
    <Label class="text-sm font-medium">Filter By Scope</Label>
    <Select.Root type="single" bind:value={() => scope.toString(), (v) => (scope = parseInt(v, 10))}>
      <Select.Trigger class="w-32">
        {filterScopeOptions.find((opt) => opt.value === scope)?.label || "Filter By ..."}
      </Select.Trigger>
      <Select.Content align="center">
        {#each filterScopeOptions as opt}
          <Select.Item value={opt.value.toString()}>
            {opt.label}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
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
</div>
