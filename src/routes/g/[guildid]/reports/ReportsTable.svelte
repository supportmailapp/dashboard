<script lang="ts">
  import * as Table from "$ui/table";
  import { ReportStatus } from "supportmail-types";
  import type { PaginatedReportsResponse } from "../../../api/v1/guilds/[guildid]/reports/+server";
  import Mention from "$lib/components/discord/Mention.svelte";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import { Button } from "$ui/button";
  import { goto } from "$app/navigation";
  import { guildHref } from "$lib";
  import MessageSquare from "@lucide/svelte/icons/message-square";
  import UserIcon from "@lucide/svelte/icons/user";

  let { items }: { items: PaginatedReportsResponse["data"] } = $props();

  const reportStatusMap: Record<ReportStatus, string> = {
    [ReportStatus.open]: "Open",
    [ReportStatus.ignored]: "Ignored",
    [ReportStatus.timeouted]: "Timed Out",
    [ReportStatus.kicked]: "Kicked",
    [ReportStatus.banned]: "Banned",
    [ReportStatus.messageDeleted]: "Message Deleted",
    [ReportStatus.resolved]: "Resolved",
  };
</script>

<Table.Root class="w-full max-w-3xl">
  <Table.Header>
    <Table.Row>
      <Table.Head class="w-[100px]">Type</Table.Head>
      <Table.Head>Status</Table.Head>
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
            {#if reportType === "message"}
              <MessageSquare class="size-5 text-blue-600" />
            {:else}
              <UserIcon class="size-5 text-yellow-600" />
            {/if}
          </div>
        </Table.Cell>
        <Table.Cell>{reportStatusMap[report.status]}</Table.Cell>
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
