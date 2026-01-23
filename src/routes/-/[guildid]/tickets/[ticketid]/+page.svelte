<script lang="ts">
  import { page } from "$app/state";
  import Mention from "$lib/components/discord/Mention.svelte";
  import Timestamp from "$lib/components/discord/Timestamp.svelte";
  import { TicketState, TicketStatus, type APIFeedback } from "$lib/sm-types";
  import { guildHref } from "$lib/stores/site.svelte.js";
  import { getMentionUser, fetchMentionUsers } from "$lib/stores/users.svelte";
  import { APIRoutes, cdnUrls } from "$lib/urls";
  import { cn, makeFallbackInitials } from "$lib/utils.js";
  import apiClient from "$lib/utils/apiClient.js";
  import { dateToLocalString, userDisplayName } from "$lib/utils/formatting.js";
  import * as Avatar from "$ui/avatar";
  import Badge from "$ui/badge/badge.svelte";
  import Button from "$ui/button/button.svelte";
  import * as Card from "$ui/card";
  import Separator from "$ui/separator/separator.svelte";
  import Skeleton from "$ui/skeleton/skeleton.svelte";
  import * as Table from "$ui/table";
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import Info from "@lucide/svelte/icons/info";
  import Star from "@lucide/svelte/icons/star";
  import { untrack } from "svelte";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  let ticket = $derived(data.ticket);

  let userMention = $derived(ticket?.userId ? getMentionUser(ticket.userId) : undefined);
  let feedback = $state<APIFeedback | null>(null);

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

  $effect(() => {
    if (ticket && ticket.feedbackId) {
      try {
        apiClient.get<APIFeedback>(APIRoutes.ticketFeedback(ticket.guildId, ticket._id)).then((res) => {
          if (res.ok) {
            res.json().then((data) => {
              feedback = data;
            });
          } else {
            toast.error(`Failed to fetch feedback: ${res.statusText}`);
          }
        });
      } catch (error) {
        toast.error(`Failed to fetch feedback: ${error}`);
      }
    }
  });

  $effect(() => {
    if (ticket && ticket.userId && !untrack(() => getMentionUser(ticket.userId))) {
      untrack(() => fetchMentionUsers(ticket.userId));
    }
  });
</script>

<Button variant="outline" class="mb-4 w-fit" href={guildHref("/tickets")}>
  <ChevronLeft class="size-4" />
  Back
</Button>

{#if ticket}
  <Card.Root>
    <Card.Header>
      <Card.Title class="inline-flex items-center gap-2 text-xl">
        <Info class="size-4.5" />
        Ticket Information
      </Card.Title>
    </Card.Header>
    <Card.Content class="flex flex-col gap-1">
      <Table.Root>
        <Table.Body>
          <Table.Row>
            <Table.Cell class="w-40 font-semibold">ID</Table.Cell>
            <Table.Cell>
              <Badge
                variant="outline"
                class="cursor-pointer font-mono text-sm select-none"
                onclick={() => {
                  navigator.clipboard.writeText(ticket.id).then(() => {
                    toast.success("Ticket ID copied to clipboard");
                  });
                }}
              >
                {ticket.id}
              </Badge>
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell class="w-40 font-semibold">Status</Table.Cell>
            <Table.Cell>
              <Badge
                class={cn(
                  ticket.status === TicketStatus.open && "bg-success/30 border-success text-foreground",
                  ticket.status === TicketStatus.closed &&
                    "bg-destructive/30 border-destructive text-foreground",
                  ticket.status === TicketStatus.closeRequested &&
                    "bg-warning/30 border-warning text-foreground",
                  "select-none",
                )}
              >
                {ticketStatusMap[ticket.status]}
              </Badge>
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell class="w-40 font-semibold">User</Table.Cell>
            <Table.Cell class="py-2">
              {#if ticket.userId && !userMention}
                <Skeleton class="h-6 w-32" />
              {:else if ticket.userId && userMention}
                <div class="flex w-full max-w-xs flex-row gap-3 rounded-lg p-3">
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
                <div class="flex w-full max-w-xs flex-row items-center gap-3">
                  <Avatar.Root class="select-none">
                    <Avatar.Fallback>
                      {makeFallbackInitials(ticket.alias)}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <p class="text-sm font-medium">{ticket.alias}</p>
                </div>
              {/if}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell class="w-40 font-semibold">Created</Table.Cell>
            <Table.Cell>
              <Timestamp date={ticket.createdAt} format="f" />
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell class="w-40 font-semibold">Last Updated</Table.Cell>
            <Table.Cell>
              <Timestamp date={ticket.lastActive} format="f" />
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell class="w-40 font-semibold">Post</Table.Cell>
            <Table.Cell>
              <Mention channelId={ticket.postId} buttons="copy" />
            </Table.Cell>
          </Table.Row>
          {#if ticket.closeComment}
            <Table.Row>
              <Table.Cell class="w-40 font-semibold">Close Comment</Table.Cell>
              <Table.Cell>{ticket.closeComment}</Table.Cell>
            </Table.Row>
          {/if}
          {#if ticket.stateTag}
            <Table.Row>
              <Table.Cell class="w-40 font-semibold">State</Table.Cell>
              <Table.Cell>{ticketStateMap[ticket.stateTag]}</Table.Cell>
            </Table.Row>
          {/if}
          {#if ticket.alias}
            <Table.Row>
              <Table.Cell colspan={2}>
                <Badge
                  variant="secondary"
                  class="ml-auto cursor-help text-sm select-none"
                  href="https://docs.supportmail.dev/version-2.1/getting-started/tickets#anonymous-support"
                  target="_blank"
                >
                  Anonymous
                </Badge>
              </Table.Cell>
            </Table.Row>
          {/if}
        </Table.Body>
      </Table.Root>
    </Card.Content>
  </Card.Root>

  {#if feedback}
    <Card.Root class="mt-4">
      <Card.Header>
        <Card.Title>Feedback</Card.Title>
        <Card.Description>{dateToLocalString(feedback.timestamp)}</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="inline-flex gap-2">
          {#each new Array(5) as _, index}
            <Star
              class={cn(
                "size-6",
                index < feedback.rating
                  ? "fill-yellow-400 text-yellow-500"
                  : "fill-muted-foreground text-muted-foreground",
              )}
            />
          {/each}
        </div>
        <Separator class="my-2" />
        <div class="bg-card-foreground/10 rounded-lg p-3">
          {#each feedback.answers as fb}
            <h2 class="text-muted-foreground text-xl font-semibold">
              {fb.label}
            </h2>
            <p class="mt-1 border-l-2 pl-3 not-last:mb-5">{fb.answer}</p>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>
  {/if}
{:else}
  <Skeleton class="h-6 w-3xl" />
{/if}
