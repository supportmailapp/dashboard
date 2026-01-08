<script lang="ts">
  import { page } from "$app/state";
  import ChannelSelect from "$lib/components/discord/ChannelSelect.svelte";
  import Mention from "$lib/components/discord/Mention.svelte";
  import FieldDialog from "$lib/components/forms/FieldDialog.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SaveAlert from "$lib/components/SaveAlert.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import type { AnyAPIFeedbackFormComponent, APIFeedbackConfig } from "$lib/sm-types";
  import { getManager } from "$lib/stores/GuildsManager.svelte";
  import { APIRoutes } from "$lib/urls";
  import { cn, isChannelSendable, SnowflakeUtil } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import { Badge } from "$ui/badge/index.js";
  import { Button, buttonVariants } from "$ui/button/index.js";
  import * as Card from "$ui/card/index.js";
  import * as Field from "$ui/field/index.js";
  import { Label } from "$ui/label";
  import * as Popover from "$ui/popover/index.js";
  import { Switch } from "$ui/switch";
  import { Textarea } from "$ui/textarea";
  import ArrowDown from "@lucide/svelte/icons/arrow-down";
  import ArrowUp from "@lucide/svelte/icons/arrow-up";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash from "@lucide/svelte/icons/trash";
  import { ChannelType, ComponentType } from "discord-api-types/v10";
  import equal from "fast-deep-equal/es6";
  import { onDestroy, onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import { flip } from "svelte/animate";
  import { fly } from "svelte/transition";

  const guildsManager = getManager();
  const channels = $derived(guildsManager.channels);

  let feedbackConfig = $state<APIFeedbackConfig | null>(null);
  let backupFeedback = $state<APIFeedbackConfig | null>(null);
  let loading = $state(true);
  let saving = $state(false);

  let editDialogOpen = $state(false);
  let editField = $state<AnyAPIFeedbackFormComponent | null>(null);
  let channelSelectOpen = $state(false);

  let unsavedChanges = $derived(!equal(backupFeedback, feedbackConfig));

  const saveFn = async function () {
    const current = $state.snapshot(feedbackConfig);
    if (!current || (backupFeedback && equal(backupFeedback, current))) {
      toast.info("Nothing to save.");
      return;
    }

    saving = true;

    try {
      const res = await apiClient.put(APIRoutes.ticketFeedback(page.params.guildid!), {
        json: current,
      });

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to save ticket feedback configuration.");
      }

      const json = await res.json<APIFeedbackConfig>();

      backupFeedback = { ...json };
      feedbackConfig = { ...json };
      toast.success("Feedback configuration saved.");
    } catch (err: any) {
      console.error("Failed to save ticket feedback configuration:", err);
      toast.error("Failed to save ticket feedback configuration.", {
        description: err.message,
      });
    } finally {
      saving = false;
    }
  };

  onMount(async () => {
    try {
      const res = await apiClient.get<APIFeedbackConfig>(APIRoutes.ticketFeedback(page.params.guildid!));
      if (!res.ok) {
        const err = await res.json<any>();
        toast.error("Failed to load ticket configuration.", {
          description: err.message || "Please try again later.",
        });
        loading = false;
        return;
      }

      const data = await res.json<APIFeedbackConfig>();
      backupFeedback = { ...data };
      feedbackConfig = { ...data };
    } catch (err: any) {
      toast.error("Failed to load ticket configuration.", { description: String(err?.message || err) });
    } finally {
      loading = false;
      saving = false;
    }
  });

  onDestroy(() => {
    backupFeedback = null;
    feedbackConfig = null;
  });

  // Field manipulation functions
  function addField() {
    if (!feedbackConfig) return;

    const newField: AnyAPIFeedbackFormComponent = {
      local: true,
      id: SnowflakeUtil.generate().toString(),
      type: ComponentType.TextDisplay,
      content: "Thank you for your feedback!",
    };

    feedbackConfig.components = [...(feedbackConfig.components || []), newField];
  }

  function moveFieldUp(index: number) {
    if (!feedbackConfig || index === 0) return;

    const newFields = [...(feedbackConfig.components || [])];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];

    feedbackConfig.components = newFields;
  }

  function moveFieldDown(index: number) {
    if (!feedbackConfig || index === (feedbackConfig.components || []).length - 1) return;

    const newFields = [...(feedbackConfig.components || [])];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];

    feedbackConfig.components = newFields;
  }

  async function fetchFeedbackChannel(): Promise<GuildSendableChannel> {
    if (!feedbackConfig || !feedbackConfig.channelId) {
      throw new Error("No feedback channel configured."); // Should never happen
    }

    // Check cache first for custom channels
    const cached = guildsManager.customChannels.get(feedbackConfig.channelId);
    if (cached && isChannelSendable(cached)) {
      return cached;
    }

    const coreChannel = channels.find((c) => c.id === feedbackConfig!.channelId);
    if (
      coreChannel &&
      ![ChannelType.GuildCategory, ChannelType.GuildForum, ChannelType.GuildMedia].includes(coreChannel.type)
    ) {
      return coreChannel as GuildSendableChannel;
    }

    const res = await apiClient.get<APIGuildChannel>(
      APIRoutes.guildChannel(page.params.guildid!, feedbackConfig.channelId),
    );

    if (!res.ok) {
      throw new Error("Failed to fetch feedback channel.");
    }

    const data = await res.json();

    if (isChannelSendable(data)) {
      // Cache the fetched channel
      guildsManager.customChannels.set(data.id, data);
      return data;
    }
    toast.error("Invalid feedback channel", {
      description: "Channel is not a sendable channel.",
    });
    throw new Error("Feedback channel is not a sendable channel.");
  }
</script>

<SaveAlert
  {saving}
  {unsavedChanges}
  discardChanges={() => {
    if (backupFeedback && feedbackConfig) {
      feedbackConfig = { ...backupFeedback };
    }
  }}
  saveData={saveFn}
/>

<div class="container max-w-4xl space-y-6" in:fly={{ x: -30, duration: 200 }}>
  <SiteHeading title="Ticket Feedback" subtitle="Configure feedback collection for closed tickets" />

  {#if loading}
    <Card.Root>
      <Card.Content class="flex items-center justify-center py-12">
        <LoadingSpinner />
      </Card.Content>
    </Card.Root>
  {:else if !feedbackConfig}
    <Card.Root>
      <Card.Content class="pt-6">
        <div class="text-center">
          <p class="text-muted-foreground">Failed to load feedback configuration.</p>
        </div>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Basic Settings -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Basic Settings</Card.Title>
        <Card.Description
          >Configure whether feedback is enabled and customize the thank you message.</Card.Description
        >
      </Card.Header>
      <Card.Content class="space-y-5">
        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <Label for="feedback-enabled">Enable Feedback</Label>
            <p class="text-muted-foreground text-sm">Collect feedback when tickets are closed</p>
          </div>
          <Switch
            variant="success"
            bind:checked={feedbackConfig.isEnabled}
            id="feedback-enabled"
            disabled={saving}
          />
        </div>

        <div class="flex items-center justify-between">
          <div class="space-y-0.5">
            <Label for="feedback-channel">Feedback Channel</Label>
            <p class="text-muted-foreground text-sm">
              The channel where feedback submissions will be sent to.
            </p>
          </div>
          <div>
            {#if !!feedbackConfig?.channelId}
              {#await fetchFeedbackChannel() then channel}
                <Mention
                  {channel}
                  onDelete={() => {
                    if (feedbackConfig) delete feedbackConfig.channelId;
                  }}
                />
              {:catch error}
                <span
                  {@attach () => {
                    toast.error("Failed to load channel", {
                      description: String(error),
                    });
                    if (feedbackConfig) delete feedbackConfig.channelId;
                  }}
                  class="text-destructive"
                >
                  Failed to load channel
                </span>
              {/await}
            {/if}
            <Popover.Root bind:open={() => channelSelectOpen, (v) => (channelSelectOpen = v)}>
              <Popover.Trigger
                class={cn(!feedbackConfig.channelId ? buttonVariants({ variant: "outline" }) : "hidden")}
              >
                Choose a channel
              </Popover.Trigger>
              <Popover.Content class="w-80">
                <ChannelSelect
                  allowCustomChannels
                  channelTypes={[
                    ChannelType.GuildText,
                    ChannelType.GuildVoice,
                    ChannelType.GuildAnnouncement,
                    ChannelType.GuildStageVoice,
                    ChannelType.AnnouncementThread,
                    ChannelType.PublicThread,
                    ChannelType.PrivateThread,
                  ]}
                  selectedId={feedbackConfig.channelId}
                  onSelect={(channel, isCustom) => {
                    if (!feedbackConfig) return;
                    // Cache custom channels to prevent duplicate fetches
                    if (isCustom && isChannelSendable(channel)) {
                      guildsManager.customChannels.set(channel.id, channel);
                    }
                    feedbackConfig.channelId = channel.id;
                    channelSelectOpen = false;
                  }}
                />
              </Popover.Content>
            </Popover.Root>
          </div>
        </div>

        <Field.Set>
          <Field.Group>
            <Field.Field>
              <Field.Label for="thank-you">Thank You Message</Field.Label>
              <Textarea
                bind:value={feedbackConfig.thankYou}
                id="thank-you"
                placeholder="Thank you for your feedback!"
                maxlength={2000}
                disabled={saving}
                rows={4}
              />
              <Field.Description>This message is shown after users submit their feedback.</Field.Description>
            </Field.Field>
          </Field.Group>
        </Field.Set>
      </Card.Content>
    </Card.Root>

    <!-- Custom Questions -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Custom Feedback Questions</Card.Title>
        <Card.Description>
          Add up to 5 custom questions to collect additional feedback. File uploads are not supported.
        </Card.Description>
      </Card.Header>
      <Card.Content class="w-auto space-y-2">
        {#if feedbackConfig.components && feedbackConfig.components.length > 0}
          <div class="flex w-auto max-w-2xl flex-col gap-1 overflow-y-auto">
            {#each feedbackConfig.components as field, index (field.id)}
              <div
                class={cn(
                  "bg-background hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/70 flex h-16 w-full flex-row items-center gap-3 rounded border p-3 shadow-xs transition duration-100",
                )}
                animate:flip={{ duration: 250 }}
              >
                <Badge variant="outline">{index + 1}</Badge>
                <span class="flex-1">
                  {field.type !== ComponentType.TextDisplay ? field.label : field.content.slice(0, 100)}
                </span>

                {#if feedbackConfig.components.length > 1}
                  <div class="flex gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      onclick={() => moveFieldUp(index)}
                      disabled={index === 0 || saving}
                      title="Move up"
                    >
                      <ArrowUp class="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onclick={() => moveFieldDown(index)}
                      disabled={index === feedbackConfig.components.length - 1 || saving}
                      title="Move down"
                    >
                      <ArrowDown class="size-4" />
                    </Button>
                  </div>
                {/if}

                <Button
                  size="icon"
                  variant="outline"
                  onclick={() => {
                    if (feedbackConfig) {
                      editField = $state.snapshot(feedbackConfig.components![index]);
                      editDialogOpen = true;
                    }
                  }}
                  disabled={saving}
                >
                  <Pencil class="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onclick={() => {
                    if (confirm("Do you really want to delete this field?")) {
                      feedbackConfig!.components = feedbackConfig!.components!.filter(
                        (f) => f.id !== field.id,
                      );
                    }
                  }}
                  disabled={saving}
                >
                  <Trash class="size-4" />
                </Button>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-muted-foreground mb-3 text-sm">No custom questions added.</p>
        {/if}

        {#if (feedbackConfig.components?.length || 0) < 5}
          <Button variant="outline" class="mt-2" onclick={() => addField()} disabled={saving}>
            <Plus class="mr-2 h-4 w-4" />
            Add Question
          </Button>
        {/if}
      </Card.Content>
    </Card.Root>

    <FieldDialog
      bind:field={editField}
      bind:open={editDialogOpen}
      saveBtnLabel="Save"
      availableTypes={[ComponentType.TextDisplay, ComponentType.TextInput, ComponentType.StringSelect]}
      onSave={(f) => {
        if (feedbackConfig && f) {
          feedbackConfig.components = feedbackConfig.components!.map((field) =>
            field.id === f.id ? f : field,
          ) as AnyAPIFeedbackFormComponent[];
        }
        editDialogOpen = false;
        editField = null;
      }}
    />
  {/if}
</div>
