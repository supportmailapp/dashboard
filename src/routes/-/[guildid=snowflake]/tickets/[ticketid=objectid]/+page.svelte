<script lang="ts">
  import Button from "$ui/button/button.svelte";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Info from "@lucide/svelte/icons/info";
  import Star from "@lucide/svelte/icons/star";
  import Citrus from "@lucide/svelte/icons/citrus";
  import { fly } from "svelte/transition";
  import * as Table from "$ui/table/index.js";
  import * as Card from "$ui/card/index.js";
  import * as Avatar from "$ui/avatar/index.js";
  import { Badge } from "$ui/badge/index.js";
  import Mention from "$components/discord/Mention.svelte";
  import Timestamp from "$components/discord/Timestamp.svelte";
  import type { APIUser } from "discord-api-types/v10";
  import { onMount } from "svelte";
  import { users, getMentionUser, fetchMentionUsers } from "$lib/stores/users.svelte.js";
  import Skeleton from "$ui/skeleton/skeleton.svelte";
  import { userDisplayName } from "$lib/utils/formatting.js";
  import { APIRoutes, cdnUrls } from "$lib/urls.svelte.js";
  import { toast } from "svelte-sonner";
  import { getCategoriesManager } from "$lib/stores/categories.svelte.js";
  import humanizeDuration from "humanize-duration";
  import apiClient from "$lib/utils/apiClient.js";
  import Separator from "$ui/separator/separator.svelte";
  import { cn } from "$lib/utils.js";
  import { TicketStatus, type APIFeedback } from "$lib/sm-types/src/index.js";
  const { humanizer } = humanizeDuration; // cjs things

  let { data } = $props();

  const cats = getCategoriesManager();
  let ticket = $derived(data.ticket);
  let author = $state<APIUser | null>(null);
  // let closer = $state<APIUser | null>(null);
  // let closeRequester = $state<APIUser | null>(null);
  let feedback = $state<APIFeedback | null>(null);

  const formatter = humanizer({
    units: ["w", "d", "h"],
    spacer: "",
    conjunction: "",
    serialComma: false,
    delimiter: " ",
    language: "shortEn",
    languages: {
      shortEn: {
        y: () => "y",
        mo: () => "mo",
        w: () => "w",
        d: () => "d",
        h: () => "h",
        m: () => "m",
        s: () => "s",
        ms: () => "ms",
      },
    },
  });

  onMount(async () => {
    if (ticket.userId) {
      fetchMentionUsers(ticket.userId);
    }

    await apiClient.get<APIFeedback>(APIRoutes.ticketFeedback(ticket._id)).then((res) => {
      if (res.ok) {
        feedback = res.data;
      }
    });
  });
</script>

<Button variant="outline" href="../tickets" class="w-fit">
  <ArrowLeft />
  Back
</Button>

{#snippet statusBadge(status: TicketStatus)}
  {#if status === TicketStatus.open}
    <Badge variant="default">O</Badge>
  {:else if status === TicketStatus.closed}
    <Badge variant="secondary">C</Badge>
  {:else if status === TicketStatus.closeRequested}
    <Badge variant="destructive">CR</Badge>
  {/if}
{/snippet}

{#snippet userDisplay(user: APIUser | null)}
  {#if !user}
    <Skeleton class="h-8 w-32" />
  {:else}
    <div class="flex w-full max-w-xs flex-row gap-3 rounded-lg p-3">
      <Avatar.Root>
        <Avatar.Image src={cdnUrls.userAvatar(user.id, user.avatar, 64)} alt={userDisplayName(user)} />
        <Avatar.Fallback class="text-lg">
          {userDisplayName(user)?.slice(0, 2).toUpperCase() ?? "??"}
        </Avatar.Fallback>
      </Avatar.Root>
      <div class="flex flex-col">
        <p class="text-sm font-medium">{userDisplayName(user)}</p>
        <p class="text-muted-foreground text-xs">
          {user.id}
        </p>
      </div>
    </div>
  {/if}
{/snippet}

{#snippet FirstCell(text: string)}
  <Table.Cell class="w-40 font-semibold">{text}</Table.Cell>
{/snippet}

<div class="flex min-w-lg flex-col gap-4" in:fly={{ x: 30, duration: 200 }}>
  <Card.Root class="w-full max-w-4xl">
    <Card.Header>
      <Card.Title class="inline-flex items-center gap-2 text-xl">
        <Info class="size-4.5" />
        General Information
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <Table.Root>
        <Table.Body>
          <Table.Row>
            {@render FirstCell("ID")}
            <Table.Cell>
              <Badge
                variant="outline"
                class="cursor-pointer font-mono text-sm select-none"
                onclick={() => {
                  navigator.clipboard.writeText(ticket._id).then(() => {
                    toast.success("Ticket ID copied to clipboard");
                  });
                }}
              >
                {ticket._id}
              </Badge>
            </Table.Cell>
          </Table.Row>

          <Table.Row>
            {@render FirstCell("Author")}
            <Table.Cell class="py-2">
              {@render userDisplay(author)}
            </Table.Cell>
          </Table.Row>

          <Table.Row>
            {@render FirstCell("Status")}
            <Table.Cell>
              {@render statusBadge(ticket.status)}
            </Table.Cell>
          </Table.Row>

          <Table.Row>
            {@render FirstCell("Created At")}
            <Table.Cell>
              <Timestamp date={ticket.createdAt} format="R" />
            </Table.Cell>
          </Table.Row>

          <Table.Row>
            {@render FirstCell("Category")}
            <Table.Cell>
              {#if cats.loaded && ticket.categoryId}
                {cats.cats.get(ticket.categoryId)?.label || "Unknown Category"}
              {:else if !cats.loaded && ticket.categoryId}
                <Skeleton class="animation-duration-1200 h-4.5 w-24" />
              {:else}
                No Category
              {/if}
            </Table.Cell>
          </Table.Row>

          <Table.Row>
            {@render FirstCell("Channel")}
            <Table.Cell>
              <Mention channelId={ticket.postId} buttons="copy" dontRetry />
            </Table.Cell>
          </Table.Row>

          <Table.Row>
            {@render FirstCell("Last Active")}
            <Table.Cell>
              <Timestamp date={ticket.lastActive} format="R" />
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </Card.Content>
  </Card.Root>

  <!-- TODO: Store close request metadata first -->
  <!-- {#if ticket.closeRequest}
    <Card.Root class="bg-[color-mix(var(--card)_70%,var(--warning))] max-w-4xl w-full">
      <Card.Header>
        <Card.Title class="inline-flex items-center gap-2 text-xl">
          <Info class="size-4.5" />
          Close Request
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <Table.Root>
          <Table.Body>
            <Table.Row>
              {@render FirstCell("Requested by")}
              <Table.Cell>
                {@render userDisplay(closeRequester)}
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              {@render FirstCell("Reason")}
              <Table.Cell>
                <span class="text-sm">{ticket.closeRequest.reason}</span>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              {@render FirstCell("Requested At")}
              <Table.Cell class="py-2">
                <Timestamp date={ticket.closeRequest.requestedAt} format="R" />
              </Table.Cell>
            </Table.Row>
            {#if ticket.closeRequest.scheduledFor}
              <Table.Row>
                {@render FirstCell("Scheduled For")}
                <Table.Cell class="py-2">
                  <Timestamp date={ticket.closeRequest.scheduledFor} format="R" />
                </Table.Cell>
              </Table.Row>
            {/if}
          </Table.Body>
        </Table.Root>
      </Card.Content>
    </Card.Root>
  {/if} -->

  {#if ticket.feedbackId && !feedback}
    <Skeleton class="h-40 w-full max-w-4xl" />
  {:else if feedback}
    <Card.Root class="w-full max-w-4xl">
      <Card.Header>
        <Card.Title class="inline-flex items-center gap-2 text-xl">
          <Citrus class="size-4.5" />
          Feedback
        </Card.Title>
        <Card.Description>
          <Timestamp date={feedback.timestamp} format="F" />
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="inline-flex gap-2">
          {#each new Array(5) as _, index}
            <Star
              class={cn(
                "size-6.5",
                index < feedback.rating
                  ? "fill-yellow-400 text-yellow-500"
                  : "fill-muted-foreground text-muted-foreground",
              )}
            />
          {/each}
        </div>
        <Separator class="my-2" />
        {#if feedback.answers && feedback.answers.length > 0}
          <Table.Root class="w-full min-w-80">
            <Table.Body>
              {#each feedback.answers as answer}
                <Table.Row>
                  <Table.Cell class="max-w-50 font-semibold">{answer.label}</Table.Cell>
                  <Table.Cell>{answer.answer}</Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        {:else}
          <p class="text-muted-foreground text-sm">No additional feedback provided.</p>
        {/if}
      </Card.Content>
    </Card.Root>
  {/if}
</div>
