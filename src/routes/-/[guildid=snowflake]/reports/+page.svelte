<script lang="ts">
  import { useSearchParams } from "runed/kit";
  import { searchParamsSchema } from "./searchParams.js";
  import SiteHeading from "$components/SiteHeading.svelte";
  import * as Table from "$ui/table/index.js";
  import * as Field from "$ui/field/index.js";
  import * as Sheet from "$ui/sheet/index.js";
  import * as Select from "$ui/select/index.js";
  import * as Pagination from "$ui/pagination/index.js";
  import Button from "$ui/button/button.svelte";
  import { buttonVariants } from "$ui/button/button.svelte";
  import { Badge } from "$ui/badge/index.js";
  import Input from "$ui/input/input.svelte";
  import Mention from "$components/discord/Mention.svelte";
  import Timestamp from "$components/discord/Timestamp.svelte";
  import { fly } from "svelte/transition";
  import { afterNavigate } from "$app/navigation";
  import { ReportStatus } from "$lib/sm-types/src";
  import { cn } from "$lib/utils.js";

  const reportStatusOptions: Record<string, string> = {
    "-1": "All",
    [ReportStatus.open]: "Open",
    [ReportStatus.ignored]: "Ignored",
    [ReportStatus.timeouted]: "Timed Out",
    [ReportStatus.kicked]: "Kicked",
    [ReportStatus.banned]: "Banned",
    [ReportStatus.messageDeleted]: "Message Deleted",
    [ReportStatus.resolved]: "Resolved",
  };

  const reportTypeOptions: Record<string, string> = {
    all: "All",
    message: "Message Report",
    user: "User Report",
  };

  const searchScopeOptions: Record<string, string> = {
    all: "All Fields",
    author: "Author",
    comment: "Comment",
    message: "Message",
    moderator: "Moderator",
    user: "Reported User",
    reason: "Reason",
  };

  let { data } = $props();

  let reports = $derived(data.reports.data);
  let pagination = $derived(data.reports.pagination);

  const params = useSearchParams(searchParamsSchema, {
    updateURL: true,
    debounce: 250,
    pushHistory: true,
    noScroll: true,
  });

  afterNavigate(({ from, to }) => {
    const guildIdChanged = from?.params?.guildid !== to?.params?.guildid;
    if (!guildIdChanged) return;
    params.reset();
  });
</script>

<SiteHeading title="Reports" />

<Sheet.Root>
  <Sheet.Trigger class={buttonVariants({ variant: "outline", size: "lg", class: "ms-auto w-fit" })}>
    Filters
  </Sheet.Trigger>
  <Sheet.Content class="w-full p-4 sm:max-w-md">
    <Field.Group>
      <Field.Field>
        <Field.Label>Status</Field.Label>
        <Select.Root
          type="single"
          bind:value={() => String(params.status), (v) => (params.status = Number(v))}
        >
          <Select.Trigger>
            {reportStatusOptions[String(params.status)] ?? "All"}
          </Select.Trigger>
          <Select.Content>
            {#each Object.entries(reportStatusOptions) as [value, label]}
              <Select.Item {value}>{label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </Field.Field>

      <Field.Field>
        <Field.Label>Report Type</Field.Label>
        <Select.Root type="single" bind:value={params.type}>
          <Select.Trigger>
            {reportTypeOptions[params.type] ?? "All"}
          </Select.Trigger>
          <Select.Content>
            {#each Object.entries(reportTypeOptions) as [value, label]}
              <Select.Item {value}>{label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </Field.Field>

      <Field.Field>
        <Field.Label>Search</Field.Label>
        <Input
          bind:value={() => params.search, (v) => (params.search = v.replace(/\s{2,}/g, ""))}
          max={512}
          placeholder="Search reports..."
        />
      </Field.Field>

      <Field.Field>
        <Field.Label>Search In</Field.Label>
        <Select.Root type="single" bind:value={params.sscope}>
          <Select.Trigger>
            {searchScopeOptions[params.sscope] ?? "All Fields"}
          </Select.Trigger>
          <Select.Content>
            {#each Object.entries(searchScopeOptions) as [value, label]}
              <Select.Item {value}>{label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        <Field.Description>Which field to search within.</Field.Description>
      </Field.Field>
    </Field.Group>
  </Sheet.Content>
</Sheet.Root>

{#snippet statusBadge(status: ReportStatus)}
  <Badge
    class={cn(
      "select-none",
      status === ReportStatus.open && "bg-success/50 text-success-foreground",
      status === ReportStatus.ignored && "bg-destructive/50 text-destructive-foreground",
      (status === ReportStatus.timeouted ||
        status === ReportStatus.kicked ||
        status === ReportStatus.banned ||
        status === ReportStatus.messageDeleted ||
        status === ReportStatus.resolved) &&
        "bg-warning/50 text-warning-foreground",
    )}
  >
    {reportStatusOptions[String(status)] ?? "Unknown"}
  </Badge>
{/snippet}

{#snippet typeBadge(message: string | undefined)}
  {@const isMessage = !!message}
  <Badge
    variant="outline"
    class={cn(
      "text-sm select-none",
      isMessage && "border-blue-600 bg-blue-600/50 text-blue-100",
      !isMessage && "border-yellow-600 bg-yellow-600/50 text-yellow-100",
    )}
  >
    {isMessage ? "Message" : "User"}
  </Badge>
{/snippet}

<div class="overflow-x-auto rounded-md" in:fly={{ x: -30, duration: 200 }}>
  <Table.Root class="w-full min-w-lg">
    <Table.Header>
      <Table.Row>
        <Table.Head>Status</Table.Head>
        <Table.Head>Type</Table.Head>
        <Table.Head>Author</Table.Head>
        <Table.Head>Reported User</Table.Head>
        <Table.Head>Created At</Table.Head>
        <Table.Head></Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each reports as report (report._id)}
        <Table.Row>
          <Table.Cell>{@render statusBadge(report.status)}</Table.Cell>
          <Table.Cell>{@render typeBadge(report.message)}</Table.Cell>
          <Table.Cell>
            <Mention userId={report.authorId} buttons="copy" />
          </Table.Cell>
          <Table.Cell>
            <Mention userId={report.userId} buttons="copy" />
          </Table.Cell>
          <Table.Cell>
            <Timestamp date={report.createdAt} format="R" />
          </Table.Cell>
          <Table.Cell>
            <Button href="./reports/{report._id}" variant="outline">View</Button>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>

<div class="mt-4 flex justify-center">
  <Pagination.Root
    bind:page={params.page}
    perPage={params.pageSize}
    count={pagination.total || 0}
    siblingCount={2}
    orientation="horizontal"
  >
    {#snippet children({ pages, currentPage })}
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.PrevButton />
        </Pagination.Item>
        {#each pages as page (page.key)}
          {#if page.type === "ellipsis"}
            <Pagination.Item>
              <Pagination.Ellipsis />
            </Pagination.Item>
          {:else}
            <Pagination.Item>
              <Pagination.Link {page} isActive={currentPage === page.value}>
                {page.value}
              </Pagination.Link>
            </Pagination.Item>
          {/if}
        {/each}
        <Pagination.Item>
          <Pagination.NextButton />
        </Pagination.Item>
      </Pagination.Content>
    {/snippet}
  </Pagination.Root>

  <div class="flex w-fit">
    <Field.Field orientation="horizontal" class="w-fit">
      <Field.Label>Per Page</Field.Label>
      <Input type="number" min={10} max={100} bind:value={params.pageSize} />
    </Field.Field>
  </div>
</div>
