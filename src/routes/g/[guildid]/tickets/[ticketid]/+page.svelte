<script lang="ts">
  import * as Card from "$ui/card";
  import * as Avatar from "$ui/avatar";
  import { page } from "$app/state";
  import { TicketState, TicketStatus } from "supportmail-types";
  import Button from "$ui/button/button.svelte";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import Mention from "$lib/components/discord/Mention.svelte";
  import Separator from "$ui/separator/separator.svelte";
  import Star from "@lucide/svelte/icons/star";
  import { cn } from "$lib/utils.js";
  import { dateToLocalString, userDisplayName } from "$lib/utils/formatting.js";
  import { cdnUrls } from "$lib/urls";
  import { mentionUsers } from "$lib/stores/users.svelte";
  import Skeleton from "$ui/skeleton/skeleton.svelte";
  import Timestamp from "$lib/components/discord/Timestamp.svelte";

  let { data } = $props();
  let { ticket, error } = data;

  let userMention = $derived(ticket?.userId ? mentionUsers.get(ticket?.userId) : undefined);

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

<Button variant="outline" class="mb-4 w-fit" href={page.data.guildHref("/tickets")}>
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
        Status: {ticketStatusMap[ticket.status]} - Last Active: {dateToLocalString(ticket.lastActive)}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      {#if ticket.userId && !userMention}
        <Skeleton class="h-6 w-32" />
      {:else if ticket.userId && userMention}
        <div class="bg-card-foreground/10 flex w-full max-w-xs flex-row gap-3 rounded-lg p-3">
          <Avatar.Root>
            <Avatar.Image
              src={cdnUrls.userAvatar(userMention.id, userMention.avatar, 64)}
              alt={userDisplayName(userMention)}
            />
            <Avatar.Fallback class="text-lg">
              {userDisplayName(userMention)?.slice(0, 2).toUpperCase() ?? "??"}
            </Avatar.Fallback>
          </Avatar.Root>
          <div class="flex flex-col">
            <p class="text-sm font-medium">{userDisplayName(userMention)}</p>
            <p class="text-muted-foreground text-xs">
              {userMention.id}
            </p>
          </div>
        </div>
      {:else if ticket.alias}
        <div class="bg-card-foreground/10 flex w-full max-w-xs flex-row gap-3 rounded-lg p-3">
          <Avatar.Root>
            <Avatar.Fallback class="text-lg">
              {ticket.alias.slice(0, 2).toUpperCase() ?? "??"}
            </Avatar.Fallback>
          </Avatar.Root>
          <div class="flex flex-col">
            <p class="text-sm font-medium">{ticket.alias}</p>
          </div>
        </div>
      {/if}
      <!-- State tag only exists when not closed -->
      {#if ticket.stateTag}
        <p>State: {ticketStateMap[ticket.stateTag]}</p>
      {/if}
      <p>Created: <Timestamp date={ticket.createdAt} /></p>
      <p>Last Updated: <Timestamp date={ticket.lastActive} /></p>
      <div class="inline-flex gap-2">
        <p>Post:</p>
        <Mention channelId={ticket.postId} fallback buttons="copy" />
      </div>
      {#if ticket.closeComment}
        <Separator class="my-3" />
        <p>Close Comment: {ticket.closeComment}</p>
      {/if}
    </Card.Content>
  </Card.Root>

  {#if ticket.feedback}
    <Card.Root class="mt-4">
      <Card.Header>
        <Card.Title>Feedback</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="inline-flex gap-2">
          {#each new Array(5) as _, index}
            <Star
              class={cn(
                "size-6",
                index < ticket.feedback.stars
                  ? "fill-yellow-400 text-yellow-500"
                  : "fill-muted-foreground text-muted-foreground",
              )}
            />
          {/each}
        </div>
        <Separator class="my-2" />
        <div class="bg-card-foreground/10 rounded-lg p-3">
          {#each ticket.feedback.questionAnswers as fb}
            <h2 class="text-muted-foreground text-xl font-semibold">
              {fb.question}
            </h2>
            <p class="mt-1 border-l-2 pl-3 [&:not(:last-child)]:mb-5">{fb.answer}</p>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>
  {/if}
{/if}
