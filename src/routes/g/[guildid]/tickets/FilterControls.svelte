<script lang="ts">
  import * as DropdownMenu from "$ui/dropdown-menu/index.js";
  import { Button } from "$ui/button/index.js";
  import { Input } from "$ui/input/index.js";
  import { Label } from "$ui/label/index.js";
  import { Checkbox } from "$ui/checkbox/index.js";
  import * as Select from "$ui/select/index.js";

  type Props = {
    status?: "all" | "open" | "closed" | "closeRequested";
    anonym?: boolean;
    search?: string;
    perPage?: number;
  };

  let {
    status = $bindable("all"),
    anonym = $bindable(false),
    search = $bindable(""),
    perPage = $bindable(20),
  }: Props = $props();

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
    { value: "closeRequested", label: "Close Requested" },
  ] as const;
</script>

<div class="bg-card flex w-full max-w-xl flex-col gap-4 rounded-lg border p-4">
  <div class="flex flex-col gap-3 sm:flex-row">
    <div class="flex-1">
      <Label class="mb-2 block text-sm font-medium">Search</Label>
      <Input placeholder="Ticket ID / User ID / Post ID" bind:value={search} class="w-full" />
    </div>

    <div class="flex gap-3 sm:items-end">
      <div class="flex flex-col gap-2">
        <Label class="text-sm font-medium">Status</Label>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button {...props} variant="outline" class="w-32">
                {statusOptions.find((opt) => opt.value === status)?.label || "Status"}
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content class="w-40" align="center">
            <DropdownMenu.RadioGroup bind:value={status as any}>
              {#each statusOptions as { value, label } (value)}
                <DropdownMenu.RadioItem {value}>{label}</DropdownMenu.RadioItem>
              {/each}
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
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
  </div>

  <div class="flex items-center gap-2 border-t pt-2">
    <Checkbox bind:checked={anonym} id="anonym-checkbox" />
    <Label for="anonym-checkbox" class="cursor-pointer text-sm">Anonymous tickets only</Label>
  </div>
</div>
