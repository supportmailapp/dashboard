<script lang="ts">
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import FileText from "@lucide/svelte/icons/file-text";
  import Info from "@lucide/svelte/icons/info";
  import Users from "@lucide/svelte/icons/users";

  import { page } from "$app/state";
  import Mention from "$lib/components/discord/Mention.svelte";
  import Timestamp from "$lib/components/discord/Timestamp.svelte";
  import Link from "$lib/components/Link.svelte";
  import { ReportStatus } from "$lib/sm-types";
  import { cn } from "$lib/utils.js";
  import Badge from "$ui/badge/badge.svelte";
  import Button from "$ui/button/button.svelte";
  import * as Card from "$ui/card";
  import Skeleton from "$ui/skeleton/skeleton.svelte";
  import * as Table from "$ui/table";
  import { toast } from "svelte-sonner";

  let { data } = $props();
  let { report } = $derived(data);

  const logMessageUrl = $derived(
    report ? `https://discord.com/channels/${report.guildId}/${report.logMessage?.replace("-", "/")}` : null,
  );
  const reportedMessageUrl = $derived(
    report ? `https://discord.com/channels/${report.guildId}/${report.message?.replace("-", "/")}` : null,
  );
  const reportType = $derived(report && report.message ? "message" : "user");

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

<Button variant="outline" class="mb-4 w-fit" href={page.data.guildHref("/reports")}>
  <ChevronLeft class="size-4" />
  Back
</Button>

{#if report}
  <!-- Card 1: Report Overview (Most Important Info) -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="inline-flex items-center gap-2 text-xl">
        <Info class="size-4.5" />
        Report Overview
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <Table.Root>
        <Table.Body>
          <!-- ID, Type, Status, Created, Last Updated -->
          <Table.Row>
            <Table.Cell class="w-40 font-semibold">ID</Table.Cell>
            <Table.Cell>
              <Badge
                variant="outline"
                class="cursor-pointer font-mono text-sm select-none"
                onclick={() => {
                  navigator.clipboard.writeText(report._id).then(() => {
                    toast.success("Report ID copied to clipboard");
                  });
                }}
              >
                {report._id}
              </Badge>
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell class="w-40 font-semibold">Type</Table.Cell>
            <Table.Cell>
              <Badge
                variant="outline"
                class={cn(
                  "text-sm select-none",
                  reportType === "message" && "border-blue-600 bg-blue-600/50 text-blue-100",
                  reportType === "user" && "border-yellow-600 bg-yellow-600/50 text-yellow-100",
                )}
              >
                {reportType === "message" ? "Message Report" : "User Report"}
              </Badge>
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell class="w-40 font-semibold">Status</Table.Cell>
            <Table.Cell>
              <Badge
                class={cn(
                  report.status === ReportStatus.open && "bg-success/50 text-success-foreground",
                  report.status === ReportStatus.ignored && "bg-destructive/50 text-destructive-foreground",
                  report.status === ReportStatus.timeouted && "bg-warning/50 text-warning-foreground",
                  report.status === ReportStatus.kicked && "bg-warning/50 text-warning-foreground",
                  report.status === ReportStatus.banned && "bg-warning/50 text-warning-foreground",
                  report.status === ReportStatus.messageDeleted && "bg-warning/50 text-warning-foreground",
                  report.status === ReportStatus.resolved && "bg-warning/50 text-warning-foreground",
                  "select-none",
                )}
              >
                {reportStatusMap[report.status]}
              </Badge>
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell class="w-40 font-semibold">Created</Table.Cell>
            <Table.Cell>
              <Timestamp date={report.createdAt} format="f" />
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell class="w-40 font-semibold">Last Updated</Table.Cell>
            <Table.Cell>
              <Timestamp date={report.updatedAt} format="f" />
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </Card.Content>
  </Card.Root>

  <!-- Card 2: People Involved -->
  <Card.Root class="mt-4">
    <Card.Header>
      <Card.Title class="inline-flex items-center gap-2 text-xl">
        <Users class="size-4.5" />
        People Involved
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <Table.Root>
        <Table.Body>
          <!-- Reported User, Report Author, Resolved By (if applicable) -->
          <Table.Row>
            <Table.Cell class="w-40 font-semibold">Reported User</Table.Cell>
            <Table.Cell>
              <Mention userId={report.userId} />
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell class="w-40 font-semibold">Report Author</Table.Cell>
            <Table.Cell>
              <Mention userId={report.authorId} />
            </Table.Cell>
          </Table.Row>
          {#if report.resolvedBy}
            <Table.Row>
              <Table.Cell class="w-40 font-semibold">Resolved By</Table.Cell>
              <Table.Cell>
                <Mention userId={report.resolvedBy} />
              </Table.Cell>
            </Table.Row>
          {/if}
        </Table.Body>
      </Table.Root>
    </Card.Content>
  </Card.Root>

  <!-- Card 3: Report Details & Actions -->
  <Card.Root class="mt-4">
    <Card.Header>
      <Card.Title class="inline-flex items-center gap-2 text-xl">
        <FileText class="size-4.5" />
        Report Details
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <Table.Root>
        <Table.Body>
          <!-- Reason, Reported Message Link, Comment, Log Message Link -->
          <Table.Row>
            <Table.Cell class="w-40 font-semibold">Reason</Table.Cell>
            <Table.Cell>{report.reason || "/"}</Table.Cell>
          </Table.Row>
          {#if reportedMessageUrl}
            <Table.Row>
              <Table.Cell class="w-40 font-semibold">Reported Message</Table.Cell>
              <Table.Cell class="space-y-1">
                <Link href={reportedMessageUrl} target="_blank">
                  View Reported Message
                  <ExternalLink class="size-4" />
                </Link>
                <p class="text-muted-foreground text-xs text-wrap">
                  Due to privacy reasons, only the reference is stored. This may change in the future.
                </p>
              </Table.Cell>
            </Table.Row>
          {/if}
          <Table.Row>
            <Table.Cell class="w-40 font-semibold">Log Message Link</Table.Cell>
            <Table.Cell class="space-y-1">
              <Link href={logMessageUrl!} target="_blank">
                View Log
                <ExternalLink class="size-4" />
              </Link>
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell class="w-40 font-semibold">Comment</Table.Cell>
            <Table.Cell>{report.comment || "/"}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </Card.Content>
  </Card.Root>
{:else}
  <Skeleton class="h-6 w-3xl" />
{/if}
