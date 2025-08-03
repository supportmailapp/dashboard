<script lang="ts">
  import * as Table from "$ui/table";
  import { TicketState, TicketStatus } from "supportmail-types";
  import type { PaginatedTicketsResponse } from "../../../api/v1/guilds/[guildid]/tickets/+server";
  import Mention from "$lib/components/discord/Mention.svelte";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import { Button } from "$ui/button";
  import { cn } from "$lib/utils";

  let { items }: { items: PaginatedTicketsResponse["data"] } = $props();

  const ticketStatusMap: Record<TicketStatus, string> = {
    [TicketStatus.open]: "Open",
    [TicketStatus.closed]: "Closed",
    [TicketStatus.closeRequested]: "Close Requested",
  };
  const ticketStateMap: Record<TicketState, string> = {
    [TicketState.awaitingRes]: "Awaiting  Staff Response",
    [TicketState.pendingQR]: "Pending Close Request",
    [TicketState.uResponded]: "User Responded",
    [TicketState.unanswered]: "Unanswered",
  };
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head class="w-[100px]">ID</Table.Head>
      <Table.Head>Status</Table.Head>
      <Table.Head>User</Table.Head>
      <Table.Head></Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each items as ticket (ticket.id)}
      <Table.Row>
        <Table.Cell class="font-mono font-medium">{ticket.id}</Table.Cell>
        <Table.Cell>{ticketStatusMap[ticket.status]}</Table.Cell>
        <!-- Anon tickets don't expose the userId -->
        <Table.Cell class={cn(ticket.alias ? "bg-primary/10 hover:bg-primary/40" : "")}>
          {#if ticket.userId}
            <Mention userId={ticket.userId} buttons="copy" />
          {:else if ticket.alias}
            <span class="text-white">{ticket.alias}</span>
          {:else}
            <span class="text-muted-foreground">Unknown User</span>
          {/if}
        </Table.Cell>
        <Table.Cell class="text-right">
          <Button variant="outline" size="icon">
            <ChevronRight class="text-muted-foreground size-4" />
          </Button>
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
  <!-- ? Maybe put the pagination in the footer with a passed snippet -->
</Table.Root>
