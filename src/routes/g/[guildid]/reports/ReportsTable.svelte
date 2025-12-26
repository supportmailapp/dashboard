<script lang="ts">
  import { goto } from "$app/navigation";
  import { guildHref } from "$lib";
  import Mention from "$lib/components/discord/Mention.svelte";
  import { ReportStatus } from "$lib/sm-types";
  import { cn } from "$lib/utils";
  import { Button } from "$ui/button";
  import * as Table from "$ui/table/index.js";
  import * as Tooltip from "$ui/tooltip/index.js";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import MessageSquare from "@lucide/svelte/icons/message-square";
  import UserIcon from "@lucide/svelte/icons/user";
  import type { ClassValue } from "clsx";
  import type { PaginatedReportsResponse } from "../../../api/v1/guilds/[guildid]/reports/+server";

  let { items }: { items: PaginatedReportsResponse["data"] } = $props();

  const reportStatusMap: Record<ReportStatus, { label: string; color: ClassValue }> = {
    [ReportStatus.open]: {
      label: "Open",
      color: "bg-green-500 text-white",
    },
    [ReportStatus.ignored]: {
      label: "Ignored",
      color: "bg-white text-black",
    },
    [ReportStatus.timeouted]: {
      label: "Timed Out",
      color: "bg-yellow-500 text-black",
    },
    [ReportStatus.kicked]: {
      label: "Kicked",
      color: "bg-orange-500 text-white",
    },
    [ReportStatus.banned]: {
      label: "Banned",
      color: "bg-red-700 text-white",
    },
    [ReportStatus.messageDeleted]: {
      label: "Message Deleted",
      color: "bg-gray-700 text-white",
    },
    [ReportStatus.resolved]: {
      label: "Resolved",
      color: "bg-blue-500 text-white",
    },
  };
</script>

{#snippet reportStatusDot(status: ReportStatus)}
  {@const _status = reportStatusMap[status]}
  <Tooltip.Provider>
    <Tooltip.Root delayDuration={100}>
      <Tooltip.Trigger>
        <div class={cn("size-3 rounded-full", _status.color)}></div>
      </Tooltip.Trigger>
      <Tooltip.Content class={cn(_status.color)} arrowClasses={cn(_status.color)}>
        {_status.label}
      </Tooltip.Content>
    </Tooltip.Root>
  </Tooltip.Provider>
{/snippet}

<Table.Root class="w-full max-w-3xl">
  <Table.Header>
    <Table.Row>
      <Table.Head class="w-[50px]">Type</Table.Head>
      <Table.Head class="w-[52px] px-1">Status</Table.Head>
      <Table.Head>User</Table.Head>
      <Table.Head></Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each items as report (report._id)}
      {@const reportType = !!report.message ? "message" : "user"}
      <Table.Row>
        <Table.Cell class="font-mono font-medium">
          <div class="grid size-8 place-items-center rounded border p-1">
            <Tooltip.Provider>
              <Tooltip.Root delayDuration={100}>
                <Tooltip.Trigger>
                  {#if reportType === "message"}
                    <MessageSquare class="size-5 text-blue-600" />
                  {:else}
                    <UserIcon class="size-5 text-yellow-600" />
                  {/if}
                </Tooltip.Trigger>
                <Tooltip.Content>
                  {reportType === "message" ? "Message Report" : "User Report"}
                </Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
        </Table.Cell>
        <Table.Cell class="flex h-13 items-center justify-center px-1">
          {@render reportStatusDot(report.status)}
        </Table.Cell>
        <Table.Cell>
          {#if report.userId}
            <Mention userId={report.userId} buttons="copy" />
          {:else}
            <span class="text-muted-foreground">Unknown User</span>
          {/if}
        </Table.Cell>
        <Table.Cell class="text-right">
          <Button
            variant="outline"
            size="icon"
            onclick={() => {
              goto(guildHref(report.guildId, `/reports/${report._id}`));
            }}
          >
            <ChevronRight class="text-muted-foreground size-4" />
          </Button>
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
  <!-- ? Maybe put the pagination in the footer with a passed snippet -->
</Table.Root>
