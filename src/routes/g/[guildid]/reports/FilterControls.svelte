<script lang="ts">
  import { Input } from "$ui/input/index.js";
  import { Label } from "$ui/label/index.js";
  import * as Select from "$ui/select/index.js";

  export type ReportSearchScope = "all" | "author" | "moderator" | "user" | "comment" | "message" | "reason";
  export type ReportSearchType = "all" | "message" | "user";

  type Props = {
    status?: StringifiedReportStatus | "all";
    search?: string;
    searchScope?: ReportSearchScope;
    perPage?: number;
    reportType?: ReportSearchType;
  };

  let {
    status = $bindable("all"),
    search = $bindable(""),
    searchScope = $bindable("all"),
    perPage = $bindable(20),
    reportType = $bindable("all"),
  }: Props = $props();

  const statusOptions: { value: StringifiedReportStatus | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "open", label: "Open" },
    { value: "ignored", label: "Ignored" },
    { value: "timeouted", label: "Timeouted" },
    { value: "kicked", label: "Kicked" },
    { value: "banned", label: "Banned" },
    { value: "messageDeleted", label: "Message Deleted" },
    { value: "resolved", label: "Resolved" },
  ] as const;

  const searchScopeOptions: { value: ReportSearchScope; label: string }[] = [
    { value: "all", label: "All" },
    { value: "author", label: "Author" },
    { value: "moderator", label: "Moderator" },
    { value: "user", label: "User" },
    { value: "reason", label: "Reason" },
    { value: "comment", label: "Comment" },
    { value: "message", label: "Message ID" },
  ];

  const searchLabelMap: Record<ReportSearchScope, string> = {
    all: "Report ID / User ID / Author ID / Reason / etc.",
    author: "Author ID",
    moderator: "Moderator ID",
    user: "User ID",
    comment: "Comment",
    message: "Message",
    reason: "Reason",
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
    <Label class="text-sm font-medium">Report Type</Label>
    <Select.Root type="single" bind:value={reportType}>
      <Select.Trigger class="w-28">
        {reportType === "all" ? "All Types" : reportType.charAt(0).toUpperCase() + reportType.slice(1)}
      </Select.Trigger>
      <Select.Content align="center">
        <Select.Item value="all">All Types</Select.Item>
        <Select.Item value="message">Message</Select.Item>
        <Select.Item value="user">User</Select.Item>
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
        {#each statusOptions as opt}
          <Select.Item value={opt.value}>
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
