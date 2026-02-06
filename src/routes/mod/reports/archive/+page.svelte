<script lang="ts">
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Expand from "@lucide/svelte/icons/expand";
  import { onDestroy, onMount } from "svelte";
  import { getBreadcrumbs } from "../../breadcrumb.svelte";
  import Button, { buttonVariants } from "$ui/button/button.svelte";
  import Mention from "$lib/components/discord/Mention.svelte";
  import * as Pagination from "$ui/pagination/index.js";
  import * as Table from "$ui/table/index.js";
  import * as Dialog from "$ui/dialog/index.js";
  import * as Avatar from "$ui/avatar/index.js";
  import Badge from "$ui/badge/badge.svelte";
  import type { IDMReport } from "$lib/server/db";
  import { toast } from "svelte-sonner";
  import { fetchGuild } from "$lib/stores/guilds.svelte";
  import Skeleton from "$ui/skeleton/skeleton.svelte";
  import { cn, parseIconToURL } from "$lib/utils";
  import { goto } from "$app/navigation";

  let { data } = $props();

  const crumbs = getBreadcrumbs();
  onMount(() => {
    crumbs.set({ label: "Reports", href: "/reports" }, { label: "Archive", href: "/reports/archive" });
  });
  onDestroy(() => {
    crumbs.pop();
  });

  const actionLabels = {
    ban_reporter: {
      class: "bg-red-500/10 text-red-500",
      label: "Reporter Banned",
    },
    ban_guild: {
      class: "bg-orange-500/10 text-orange-500",
      label: "Guild Banned",
    },
    manual: {
      class: "bg-sky-500/10 text-sky-500",
      label: "Manual Review",
    },
    ignored: {
      class: "bg-green-500/10 text-green-500",
      label: "Ignored",
    },
  };

  class SelectedReport {
    data = $state<DocumentWithId<IDMReport>>();
    open = $state(false);
    selectedAction = $state<"ban_reporter" | "ban_guild" | "manual" | "ignored" | null>(null);

    constructor() {}

    select(id: string) {
      const report = data.reports.find((r) => r._id === id);
      if (report) {
        this.data = report;
        this.open = true;
      } else {
        toast.warning("Report not found");
      }
    }
  }
  const selected = new SelectedReport();
</script>

<div class="flex w-full justify-start">
  <Button href="/mod/reports" variant="outline">
    <ArrowLeft />
    Reports
  </Button>
</div>

<Pagination.Root
  class="my-2"
  count={data.maxPages}
  page={data.page}
  onPageChange={async (num) => {
    console.log("Page changed to", num);
    await goto(`?page=${num}`, { replaceState: true });
  }}
>
  {#snippet children({ pages, currentPage })}
    <Pagination.Content>
      <Pagination.Item>
        <Pagination.Previous />
      </Pagination.Item>
      {#each pages as page (page.key)}
        {#if page.type === "ellipsis"}
          <Pagination.Item>
            <Pagination.Ellipsis />
          </Pagination.Item>
        {:else}
          <Pagination.Item>
            <Pagination.Link {page} isActive={currentPage === page.value}>
              {#snippet child({ ...props })}
                <a href="?page={page.value}" class={buttonVariants({ variant: "outline", size: "sm" })}>
                  {page.value}
                </a>
              {/snippet}
            </Pagination.Link>
          </Pagination.Item>
        {/if}
      {/each}
      <Pagination.Item>
        <Pagination.Next />
      </Pagination.Item>
    </Pagination.Content>
  {/snippet}
</Pagination.Root>

{#snippet actionBadge(status?: "ban_reporter" | "ban_guild" | "manual" | "ignored")}
  {#if !!status}
    <Badge variant="outline" class={cn("border", actionLabels[status].class)}>
      {actionLabels[status].label}
    </Badge>
  {:else}
    <Badge variant="outline">Unknown</Badge>
  {/if}
{/snippet}

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head>Report ID</Table.Head>
      <Table.Head>Status</Table.Head>
      <Table.Head>Created At</Table.Head>
      <Table.Head>Reporter</Table.Head>
      <Table.Head class="w-20"></Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each data.reports as report (report._id)}
      <Table.Row>
        <Table.Cell class="font-mono">
          {report._id.slice(0, 8)}
        </Table.Cell>
        <Table.Cell>
          {@render actionBadge(report.actionTaken)}
        </Table.Cell>
        <Table.Cell>{new Date(report.createdAt).toLocaleString()}</Table.Cell>
        <Table.Cell>
          <Mention userId={report.reporterUserId} buttons="copy" />
        </Table.Cell>
        <Table.Cell>
          <Button variant="outline" onclick={() => selected.select(report._id)}>
            <Expand />
          </Button>
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>

<Dialog.Root
  bind:open={selected.open}
  onOpenChangeComplete={(_open) => {
    if (!_open) {
      selected.data = undefined;
      selected.selectedAction = null;
    }
  }}
>
  <Dialog.Content class="w-full sm:max-w-4xl">
    {#if selected.data}
      <Table.Root>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Report ID</Table.Cell>
            <Table.Cell class="font-mono">{selected.data?._id}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Status</Table.Cell>
            <Table.Cell>
              {@render actionBadge(selected.data.actionTaken)}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Reporter</Table.Cell>
            <Table.Cell>
              <Mention userId={selected.data.reporterUserId} buttons="copy" />
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Created At</Table.Cell>
            <Table.Cell>{new Date(selected.data.createdAt).toLocaleString()}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Reason</Table.Cell>
            <Table.Cell>{selected.data.reportReason}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Author</Table.Cell>
            <Table.Cell>
              <Mention userId={selected.data.authorId} buttons="copy" />
            </Table.Cell>
          </Table.Row>
          <Table.Row class="h-auto">
            <Table.Cell>Message</Table.Cell>
            <Table.Cell class="max-w-100 text-wrap wrap-break-word">
              {selected.data.messageContent}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Guild Data</Table.Cell>
            <Table.Cell>
              {#await fetchGuild(selected.data.guildId)}
                <Skeleton class="h-10 w-32" />
              {:then guild}
                {#if !guild}
                  <span>Guild not found</span>
                {:else}
                  <div class="flex items-center gap-2">
                    <Avatar.Root>
                      <Avatar.Image
                        src={parseIconToURL(guild.icon, guild.id, "guild", 64)}
                        alt={guild.name}
                      />
                      <Avatar.Fallback>{guild.name.slice(0, 2).toUpperCase()}</Avatar.Fallback>
                    </Avatar.Root>
                    <span>{guild?.name} ({guild?.memberCount ?? "?"} members)</span>
                  </div>
                {/if}
              {/await}
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    {/if}
  </Dialog.Content>
</Dialog.Root>
