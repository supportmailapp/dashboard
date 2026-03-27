<script lang="ts">
  import { useSearchParams } from "runed/kit";
  import { searchParamsSchema } from "./searchParams.js";
  import SiteHeading from "$components/SiteHeading.svelte";
  import * as Table from "$ui/table/index.js";
  import * as Field from "$ui/field/index.js";
  import * as Sheet from "$ui/sheet/index.js";
  import * as Select from "$ui/select/index.js";
  import * as Pagination from "$ui/pagination/index.js";
  import Combobox from "$ui/combobox/combobox.svelte";
  import Button from "$ui/button/button.svelte";
  import { buttonVariants } from "$ui/button/button.svelte";
  import Input from "$ui/input/input.svelte";
  import { getCategoriesManager } from "$lib/stores/categories.svelte.js";
  import { afterNavigate } from "$app/navigation";
  import Mention from "$components/discord/Mention.svelte";
  import Timestamp from "$components/discord/Timestamp.svelte";
  import { Badge } from "$ui/badge/index.js";
  import Skeleton from "$ui/skeleton/skeleton.svelte";
  import Switch from "$ui/switch/switch.svelte";
  import { DocsLinks } from "$lib/urls.svelte.js";
  import { fly } from "svelte/transition";
  import { MiniSnowflakeSchema } from "$lib/utils/schemas.js";
  import { TicketStatus } from "$lib/sm-types/src";

  let { data } = $props();

  let tickets = $derived(data.tickets.data);
  let pagination = $derived(data.tickets.pagination);
  const cats = getCategoriesManager();
  const params = useSearchParams(searchParamsSchema, {
    updateURL: true,
    debounce: 250,
    pushHistory: true,
  });
  let userIdInput = $state("");

  $effect(() => {
    console.log("Search params changed:", params.toURLSearchParams().toString());
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
        <Select.Root type="multiple" bind:value={params.status}>
          <Select.Trigger>Status</Select.Trigger>
          <Select.Content>
            <Select.Item value="open">Open</Select.Item>
            <Select.Item value="closed">Closed</Select.Item>
            <Select.Item value="deleted">Deleted</Select.Item>
          </Select.Content>
        </Select.Root>
      </Field.Field>

      <Field.Field>
        <Field.Label>User ID</Field.Label>
        <Input
          autocomplete="off"
          type="text"
          placeholder="User ID"
          bind:value={
            () => userIdInput,
            (v) => {
              userIdInput = v;
              params.userId = v?.trim() || "";
            }
          }
        />
        <Field.Description>User ID of ticket author or claimer</Field.Description>
        {#if userIdInput && !MiniSnowflakeSchema.safeParse(userIdInput).success}
          <Field.Error>
            User ID is not a valid snowflake.
            <a href={DocsLinks.findIds} target="_blank" class="link">Find a User ID</a>
          </Field.Error>
        {/if}
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
          <Skeleton class="h-8 w-32 animation-duration-1200" />
        {/if}
      </Field.Field>

      <!-- uncategorized? -->
      <Field.Field orientation="horizontal">
        <Switch
          bind:checked={params.uncategorized}
          id="filter-uncat"
          disabled={params.category.length === 0}
        />
        <Field.Content>
          <Field.Label for="filter-uncat">Uncategorized</Field.Label>
          {#if params.category.length === 0}
            <Field.Description class="text-warning">
              Select categories first to include uncategorized tickets
            </Field.Description>
          {:else}
            <Field.Description>
              Include tickets without a category in addition to selected categories
            </Field.Description>
          {/if}
        </Field.Content>
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
            <Mention userId={ticket.userId} buttons="copy" />
          </Table.Cell>
          <Table.Cell>
            <Timestamp date={ticket.createdAt} format="R" />
          </Table.Cell>
          <Table.Cell>
            {#if cats.loaded}
              {cats.cats.get(ticket.category)?.label || "Unknown Category"}
            {:else}
              <Skeleton class="h-4.5 w-24 animation-duration-1200" animationDelay={i * 200} />
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
</div>
