<script lang="ts">
  import * as Card from "$ui/card";
  import { page } from "$app/state";
  import { TicketState, TicketStatus } from "supportmail-types";
  import Button from "$ui/button/button.svelte";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import Mention from "$lib/components/discord/Mention.svelte";
  import Separator from "$ui/separator/separator.svelte";

  let { data } = $props();
  let { ticket, error } = data;

  const ticketStatusMap: Record<TicketStatus, string> = {
    [TicketStatus.open]: "Open",
    [TicketStatus.closed]: "Closed",
    [TicketStatus.closeRequested]: "Close Requested",
  };
  const ticketStateMap: Record<TicketState, string> = {
    [TicketState.awaitingRes]: "Awaiting Staff Response",
    [TicketState.pendingQR]: "Pending Close Request",
    [TicketState.uResponded]: "User Responded",
    [TicketState.unanswered]: "Unanswered",
  };
</script>

<Button variant="outline" class="w-fit" href={page.data.guildHref("/tickets")}>
  <ChevronLeft class="size-4" />
  Back
</Button>

{#if error}
  <p>{error}</p>
{/if}

{#if ticket}
  <Card.Root>
    <Card.Header>
      <Card.Title>Ticket #{ticket.id}</Card.Title>
      <Card.Description>
        Status: {ticketStatusMap[ticket.status]} - Last Active: {new Date(ticket.lastActive).toLocaleString()}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="inline-flex gap-2">
        {#if ticket.alias}
          <p>Alias: {ticket.alias}</p>
        {:else if ticket.userId}
          <span>User:</span><Mention userId={ticket.userId} buttons="copy" />
        {/if}
      </div>
      <!-- State tag only exists when not closed -->
      {#if ticket.stateTag}
        <p>State: {ticketStateMap[ticket.stateTag]}</p>
      {/if}
      <p>Created: {new Date(ticket.createdAt).toLocaleString()}</p>
      <p>Last Updated: {new Date(ticket.lastActive).toLocaleString()}</p>
      <div class="inline-flex gap-2">
        <p>Post:</p>
        <Mention channelId={ticket.postId} fallback buttons="copy" />
      </div>
      {#if ticket.closeComment}
        <Separator class="my-4" />
        <p>Close Comment: {ticket.closeComment}</p>
      {/if}
    </Card.Content>
  </Card.Root>
{/if}
