<script lang="ts">
  import { useSearchParams } from "runed/kit";
  import { searchParamsSchema } from "./searchParams.js";
  import SiteHeading from "$components/SiteHeading.svelte";
  import * as Table from "$ui/table/index.js";
  import * as Field from "$ui/field/index.js";
  import * as Sheet from "$ui/sheet/index.js";
  import * as Select from "$ui/select/index.js";
  import * as Pagination from "$ui/pagination/index.js";
  import * as Popover from "$ui/popover/index.js";
  import Combobox from "$ui/combobox/combobox.svelte";
  import Button from "$ui/button/button.svelte";
  import { buttonVariants } from "$ui/button/button.svelte";
  import { getCategoriesManager } from "$lib/stores/categories.svelte.js";
  import { afterNavigate } from "$app/navigation";
  import Mention from "$components/discord/Mention.svelte";
  import Timestamp from "$components/discord/Timestamp.svelte";
  import { Badge } from "$ui/badge/index.js";
  import Skeleton from "$ui/skeleton/skeleton.svelte";
  import Switch from "$ui/switch/switch.svelte";
  import { fly } from "svelte/transition";
  import { TicketStatus } from "$lib/sm-types/src";
  import UserSelect from "$lib/components/discord/UserSelect.svelte";
  import ChannelSelect from "$lib/components/discord/ChannelSelect.svelte";
  import { ChannelType } from "discord-api-types/v10";
  import Input from "$ui/input/input.svelte";
  import Checkbox from "$ui/checkbox/checkbox.svelte";

  const ticketStatusOptions: Record<TicketStatus, string> = {
    [TicketStatus.open]: "Open",
    [TicketStatus.closed]: "Closed",
    [TicketStatus.closeRequested]: "Close Requested",
  };

  let { data } = $props();

  let tickets = $derived(data.tickets.data);
  let pagination = $derived(data.tickets.pagination);
  const cats = getCategoriesManager();
  const params = useSearchParams(searchParamsSchema, {
    updateURL: true,
    debounce: 250,
    pushHistory: true,
  });

  afterNavigate(({ from, to }) => {
    // Reset filters when navigating away
    const guildIdChanged = from?.params?.guildid !== to?.params?.guildid;
    if (!guildIdChanged) return;
    params.reset();
  });
</script>

<SiteHeading title="Tickets" />

<Sheet.Root>
  <Sheet.Trigger class={buttonVariants({ variant: "outline", size: "lg", class: "ms-auto w-fit" })}>
    Filters
  </Sheet.Trigger>
  <Sheet.Content class="w-full p-4 sm:max-w-md">
    <Field.Group>
      <Field.Field>
        <Field.Label>Status</Field.Label>
        <Select.Root
          type="multiple"
          bind:value={
            () => params.status.map(String),
            (vals) => {
              params.status = vals.map((v) => Number(v) as TicketStatus);
            }
          }
        >
          <Select.Trigger>Status</Select.Trigger>
          <Select.Content>
            {#each Object.entries(ticketStatusOptions) as [value, label]}
              <Select.Item value={String(value)}>{label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </Field.Field>

      <Field.Field>
        <Field.Label>Ticket Author</Field.Label>
        {#if params.userId}
          <div class="bg-input rounded-md border px-2 py-1.5">
            <Mention userId={params.userId} onDelete={() => (params.userId = "")} />
          </div>
        {:else}
          <Popover.Root>
            <Popover.Trigger class={buttonVariants({ variant: "outline", size: "sm" })}>
              Ticket Author
            </Popover.Trigger>
            <Popover.Content>
              <UserSelect
                excludedUserIds={params.userId ? [params.userId] : []}
                onSelect={({ id }) => (params.userId = id)}
              />
            </Popover.Content>
          </Popover.Root>
        {/if}
        <Field.Description>
          User who created the Ticket<br />
          <i>Anonymous tickets are never filtered by user</i>
        </Field.Description>
      </Field.Field>

      <Field.Field>
        <Field.Label>Post</Field.Label>
        {#if params.postId}
          <div class="bg-input rounded-md border px-2 py-1.5">
            <Mention channelId={params.postId} onDelete={() => (params.postId = "")} />
          </div>
        {:else}
          <Popover.Root>
            <Popover.Trigger class={buttonVariants({ variant: "outline", size: "sm" })}>
              Ticket Post
            </Popover.Trigger>
            <Popover.Content>
              <ChannelSelect
                allowCustomChannels
                excludedChannelIds={params.postId ? [params.postId] : []}
                channelTypes={[ChannelType.PublicThread]}
                onSelect={({ id }) => (params.postId = id)}
                selectedId={params.postId}
              />
            </Popover.Content>
          </Popover.Root>
        {/if}
        <Field.Description>Post of the Ticket</Field.Description>
      </Field.Field>

      <Field.Field>
        <Field.Label>Category</Field.Label>
        {#if cats.loaded}
          <Combobox
            options={cats.cats
              .values()
              .toArray()
              .map((cat) => ({ label: cat.label, value: cat._id }))}
            filter={(...args) => cats.filter(...args)}
            bind:selected={params.category}
          />
        {:else}
          <Skeleton class="animation-duration-1200 h-8 w-32" />
        {/if}
      </Field.Field>

      <Field.Field>
        <Field.Label>Anonymous Tickets</Field.Label>
        <Checkbox bind:checked={params.anonym} />
        <Field.Description>Include anonymous tickets in the results.</Field.Description>
      </Field.Field>

      <Field.Field>
        <Field.Label>Close Comment</Field.Label>
        <Input
          // Trim 2+ whitespace to prevent users from accidentally entering long strings of spaces which would cause expensive regex queries
          // trimming on start and end is done on server because a user might want to write a comment that includes a space and when type a space they might want to add text after that
          bind:value={() => params.comment, (v) => (params.comment = v.replace(/\s{2,}/g, ""))}
          max={512}
        />
        <Field.Description>
          Filters by close comment content. This is case-insensitive and filters comments partially.
        </Field.Description>
      </Field.Field>
    </Field.Group>
  </Sheet.Content>
</Sheet.Root>

{#snippet statusBadge(status: TicketStatus)}
  {#if status === TicketStatus.open}
    <Badge variant="default">O</Badge>
  {:else if status === TicketStatus.closed}
    <Badge variant="secondary">C</Badge>
  {:else if status === TicketStatus.closeRequested}
    <Badge variant="destructive">CR</Badge>
  {/if}
{/snippet}

<div class="overflow-x-auto rounded-md" in:fly={{ x: -30, duration: 200 }}>
  <Table.Root class="w-full min-w-lg">
    <Table.Header>
      <Table.Row>
        <Table.Head>Status</Table.Head>
        <Table.Head>User</Table.Head>
        <Table.Head>Created At</Table.Head>
        <Table.Head>Category</Table.Head>
        <Table.Head></Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each tickets as ticket, i (ticket._id)}
        <Table.Row>
          <Table.Cell>{@render statusBadge(ticket.status)}</Table.Cell>
          <Table.Cell>
            {#if ticket.userId && !ticket.alias}
              <Mention userId={ticket.userId} buttons="copy" />
            {:else if ticket.alias}
              <Badge variant="outline">{ticket.alias}</Badge>
            {/if}
          </Table.Cell>
          <Table.Cell>
            <Timestamp date={ticket.createdAt} format="R" />
          </Table.Cell>
          <Table.Cell>
            {#if cats.loaded}
              {cats.cats.get(ticket.category)?.label || "Unknown Category"}
            {:else}
              <Skeleton class="animation-duration-1200 h-4.5 w-24" animationDelay={i * 200} />
            {/if}
          </Table.Cell>
          <Table.Cell>
            <Button href="./tickets/{ticket._id}" variant="outline">View</Button>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>

<div class="mt-4 flex justify-center">
  <Pagination.Root
    bind:page={params.page}
    perPage={params.limit}
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
      <Input type="number" min={1} max={100} bind:value={params.limit} />
    </Field.Field>
  </div>
</div>
