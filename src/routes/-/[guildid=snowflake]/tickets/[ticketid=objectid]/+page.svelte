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
  import { getUserManager } from "$lib/stores/users.svelte.js";
  import Skeleton from "$ui/skeleton/skeleton.svelte";
  import { userDisplayName } from "$lib/utils/formatting.js";
  import { APIRoutes, cdnUrls } from "$lib/urls.svelte.js";
  import { toast } from "svelte-sonner";
  import type { TicketStatus } from "$lib/server/db/index.js";
  import { getCategoriesManager } from "$lib/stores/categories.svelte.js";
  import humanizeDuration from "humanize-duration";
  import type { APIFeedback } from "../../../../api/authed/guilds/[guildid=snowflake]/tickets/[ticketid=objectid]/feedback/+server.js";
  import apiClient from "$lib/utils/apiClient.js";
  import Separator from "$ui/separator/separator.svelte";
  import { cn } from "$lib/utils.js";
  const { humanizer } = humanizeDuration; // cjs things

  let { data } = $props();

  const cats = getCategoriesManager();
  const users = getUserManager();
  let ticket = $derived(data.ticket);
  let author = $state<APIUser | null>(null);
  let claimer = $state<APIUser | null>(null);
  let closer = $state<APIUser | null>(null);
  let closeRequester = $state<APIUser | null>(null);
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
      users.fetch(ticket.userId).then((user) => {
        author = user;
      });
    }
    if (ticket.claimedBy) {
      users.fetch(ticket.claimedBy).then((user) => {
        claimer = user;
      });
    }
    if (ticket.closedBy) {
      users.fetch(ticket.closedBy).then((user) => {
        closer = user;
      });
    }
    if (ticket.closeRequest?.requestedBy) {
      users.fetch(ticket.closeRequest.requestedBy).then((user) => {
        closeRequester = user;
      });
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
  {#if status === "open"}
    <Badge variant="default">Open</Badge>
  {:else if status === "closed"}
    <Badge variant="secondary">Closed</Badge>
  {:else if status === "deleted"}
    <Badge variant="destructive">Deleted</Badge>
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
        <p class="text-xs text-muted-foreground">
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
  <Card.Root>
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
              {#if cats.loaded}
                {cats.cats.get(ticket.category)?.name || "Unknown Category"}
              {:else}
                <Skeleton class="h-4.5 w-24 animation-duration-1200" />
              {/if}
            </Table.Cell>
          </Table.Row>

          <Table.Row>
            {@render FirstCell("Channel")}
            <Table.Cell>
              <Mention channelId={ticket.channelId} buttons="copy" dontRetry />
            </Table.Cell>
          </Table.Row>

          {#if ticket.claimedBy}
            <Table.Row>
              {@render FirstCell("Claimed By")}
              <Table.Cell class="py-2">
                {@render userDisplay(claimer)}
              </Table.Cell>
            </Table.Row>
          {/if}

          {#if ticket.closedAt}
            <Table.Row>
              {@render FirstCell("Closed At")}
              <Table.Cell>
                <Timestamp date={ticket.closedAt} format="F" />
              </Table.Cell>
            </Table.Row>
          {/if}

          {#if ticket.closedBy}
            <Table.Row>
              {@render FirstCell("Closed By")}
              <Table.Cell class="py-2">
                {@render userDisplay(closer)}
              </Table.Cell>
            </Table.Row>
          {/if}

          {#if ticket.firstMessageAfter}
            <Table.Row>
              {@render FirstCell("First Response Time")}
              <Table.Cell>
                {formatter(ticket.firstMessageAfter)}
              </Table.Cell>
            </Table.Row>
          {/if}
        </Table.Body>
      </Table.Root>
    </Card.Content>
  </Card.Root>

  {#if ticket.closeRequest}
    <Card.Root class="bg-[color-mix(var(--card)_70%,var(--warning))]">
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
  {/if}

  {#if feedback}
    <Card.Root>
      <Card.Header>
        <Card.Title class="inline-flex items-center gap-2 text-xl">
          <Citrus class="size-4.5" />
          Feedback
        </Card.Title>
        <Card.Description>
          <Timestamp date={feedback.createdAt} format="F" />
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
        {#if feedback.comment}
          <span class="text-sm">{feedback.comment}</span>
        {/if}
      </Card.Content>
    </Card.Root>
  {/if}
</div>
