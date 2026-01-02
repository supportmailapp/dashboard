<script lang="ts">
  import { Checkbox } from "$ui/checkbox/index.js";
  import { Input } from "$ui/input/index.js";
  import { Label } from "$ui/label/index.js";
  import * as Select from "$ui/select/index.js";

  export type TicketSearchScope = "all" | "ticketid" | "userid" | "postid";

  type Props = {
    status?: "all" | "open" | "closed" | "closeRequested";
    anonym?: boolean;
    search?: string;
    searchScope?: TicketSearchScope;
    perPage?: number;
  };

  let {
    status = $bindable("all"),
    anonym = $bindable(false),
    search = $bindable(""),
    searchScope = $bindable("all"),
    perPage = $bindable(20),
  }: Props = $props();

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
    { value: "closeRequested", label: "Close Requested" },
  ] as const;

  const searchScopeOptions: { value: TicketSearchScope; label: string }[] = [
    { value: "all", label: "All" },
    { value: "ticketid", label: "Ticket ID" },
    { value: "userid", label: "User ID" },
    { value: "postid", label: "Post ID" },
  ];

  const searchLabelMap: Record<TicketSearchScope, string> = {
    all: "Ticket ID / User ID / Post ID",
    ticketid: "Ticket ID",
    userid: "User ID",
    postid: "Post ID",
  };
  let searchLabel = $derived(searchLabelMap[searchScope]);
</script>

<div class="bg-card flex w-full max-w-3xl flex-wrap gap-3 rounded-lg border p-4">
  <div class="flex w-full max-w-xs flex-col gap-2">
    <Label class="text-sm font-medium">Search</Label>
    <Input placeholder="Filter" bind:value={search} class="w-full" />
    <p class="text-muted-foreground ml-1 text-xs">{searchLabel}</p>
  </div>

  <div class="flex flex-col gap-2">
    <Label class="text-sm font-medium">Search Scope</Label>
    <Select.Root type="single" bind:value={searchScope}>
      <Select.Trigger class="w-32">
        {searchScopeOptions.find((opt) => opt.value === searchScope)?.label || "Search Scope"}
      </Select.Trigger>
      <Select.Content align="center">
        {#each searchScopeOptions as opt}
          <Select.Item value={opt.value}>
            {opt.label}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>

  <div class="flex flex-col gap-2">
    <Label class="text-sm font-medium">Status</Label>
    <Select.Root type="single" bind:value={status}>
      <Select.Trigger class="w-42">
        {statusOptions.find((opt) => opt.value === status)?.label || "Status"}
      </Select.Trigger>
      <Select.Content align="center">
        <Select.Item value="all">All</Select.Item>
        <Select.Item value="open">Open</Select.Item>
        <Select.Item value="closed">Closed</Select.Item>
        <Select.Item value="closeRequested">Close Requested</Select.Item>
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

  <div class="flex w-full items-center gap-2 border-t pt-2">
    <Label class="cursor-pointer text-sm">
      <Checkbox bind:checked={anonym} id="anonym-checkbox" />
      Anonymous tickets only
    </Label>
  </div>
</div>
