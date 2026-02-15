<script lang="ts">
  import { page } from "$app/state";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SaveAlert from "$lib/components/SaveAlert.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import type { APIPanel } from "$lib/sm-types/src";
  import { APIRoutes } from "$lib/urls";
  import { determineUnsavedChanges } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import { toast } from "svelte-sonner";
  import * as Card from "$ui/card/index";
  import * as Field from "$ui/field/index";
  import * as Tabs from "$ui/tabs/index";
  import * as Popover from "$ui/popover/index";
  import Button, { buttonVariants } from "$ui/button/button.svelte";
  import Pencil from "@lucide/svelte/icons/pencil";
  import PanelDialog from "$lib/components/panel/PanelDialog.svelte";
  import { fly } from "svelte/transition";
  import { afterNavigate } from "$app/navigation";
  import AllowedMentions from "./AllowedMentions.svelte";
  import { type APIMessage, ChannelType } from "discord-api-types/v10";
  import ChannelSelect from "$lib/components/discord/ChannelSelect.svelte";
  import Mention from "$lib/components/discord/Mention.svelte";
  import Input from "$ui/input/input.svelte";
  import { parseDiscordLink } from "$lib/utils/formatting";
  import { setTagsManager } from "$lib/components/panel/tags.svelte";
  import { setCategoriesManager } from "$lib/components/panel/categories.svelte";

  setTagsManager();
  setCategoriesManager();
  let oldPanel: APIPanel | null = null;
  let panel = $state<APIPanel | null>(null);
  let loading = $state(true);
  let saving = $state(false);
  let sending = $state(false);
  let unsavedChanges = $derived(determineUnsavedChanges(oldPanel, $state.snapshot(panel)));
  const dialog = $state({
    panel: false,
    mentions: false,
    channel: false,
  });

  $inspect(panel?.messageId);

  async function fetchPanel() {
    loading = true;
    const res = await apiClient.get<APIPanel>(APIRoutes.panel(page.params.guildid!));

    if (res.ok) {
      const jsonRes = await res.json();
      panel = jsonRes;
      oldPanel = { ...jsonRes };
    } else {
      panel = {
        guildId: page.params.guildid!,
        data: [],
        allowedMentions: {
          everyone: false,
          roles: [],
          users: [],
          roleMode: "none",
          userMode: "none",
        },
      };
      oldPanel = { ...$state.snapshot(panel) };
    }

    loading = false;
  }

  async function savePanel() {
    if (!panel) {
      toast.error("No panel to save.");
      return;
    }

    saving = true;
    const currentPanel = $state.snapshot(panel);

    const res = await apiClient.put<APIPanel>(APIRoutes.panel(page.params.guildid!), {
      json: currentPanel,
    });

    if (res.ok) {
      const jsonRes = await res.json();
      panel = jsonRes;
      oldPanel = { ...jsonRes };
      toast.success("Panel saved successfully.");
    } else {
      toast.error("Failed to save panel.");
    }

    saving = false;
  }

  async function sendPanel() {
    if (!panel) {
      toast.error("No panel to send.");
      return;
    }

    if (!panel.channelId) {
      toast.error("No channel selected to send the panel.");
      return;
    }
    sending = true;

    const res = await apiClient.post<APIMessage>(APIRoutes.sendPanel(page.params.guildid!), {
      json: panel,
    });

    if (res.ok) {
      toast.success("Panel sent successfully.");
    } else {
      const jsonRes = await res.json().catch(() => ({}) as any);
      toast.error(`Failed to send panel`, { description: `${jsonRes.message ?? "Unknown error"}` });
    }
    sending = false;
  }

  afterNavigate(fetchPanel);
</script>

<SaveAlert
  {saving}
  {unsavedChanges}
  discardChanges={() => {
    if (oldPanel && panel) {
      panel = { ...oldPanel };
    }
  }}
  saveData={savePanel}
/>

<div class="container mb-40 max-w-3xl space-y-6" in:fly={{ x: -30, duration: 200 }}>
  <SiteHeading
    title="Panel"
    subtitle="Configure a custom message for your server from which your members can create tickets"
  />

  <div class="flex flex-col gap-3">
    {#if !loading && panel}
      <Card.Root>
        <Card.Header>
          <Card.Title>Panel Configuration</Card.Title>
        </Card.Header>
        <Card.Content>
          <Field.Group>
            <Field.Field orientation="horizontal">
              <Field.Label>Panel Data</Field.Label>
              <Button onclick={() => (dialog.panel = true)}>
                <Pencil />
                Edit Panel
              </Button>
            </Field.Field>

            <Field.Field orientation="horizontal">
              <Field.Label>Allowed Mentions</Field.Label>
              <AllowedMentions bind:open={dialog.mentions} bind:allowedMentions={panel.allowedMentions} />
            </Field.Field>
          </Field.Group>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Panel Actions</Card.Title>
        </Card.Header>
        <Card.Content>
          <Tabs.Root value="send">
            <Tabs.List class="mb-2 w-full">
              <Tabs.Trigger value="send">Send</Tabs.Trigger>
              <Tabs.Trigger value="edit">Edit</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="send">
              <Field.Field>
                <Field.Label>Channel</Field.Label>
                {#if !panel.channelId}
                  <Popover.Root bind:open={dialog.channel}>
                    <Popover.Trigger
                      class={buttonVariants({ variant: "outline", class: "w-fit" })}
                      disabled={!!loading}
                    >
                      Select Channel
                    </Popover.Trigger>
                    <Popover.Content class="w-80">
                      <div class="h-100 w-full max-w-100">
                        <ChannelSelect
                          selectedId={panel.channelId ?? undefined}
                          channelTypes={[
                            ChannelType.GuildText,
                            ChannelType.GuildVoice,
                            ChannelType.GuildStageVoice,
                            ChannelType.GuildAnnouncement,
                            ChannelType.AnnouncementThread,
                            ChannelType.PublicThread,
                            ChannelType.PrivateThread,
                          ]}
                          allowCustomChannels
                          excludedChannelIds={panel.channelId ? [panel.channelId] : []}
                          onSelect={(c) => {
                            if (!panel) return;
                            panel.channelId = c.id;
                            panel.messageId = undefined;
                            dialog.channel = false;
                          }}
                        />
                      </div>
                    </Popover.Content>
                  </Popover.Root>
                {:else}
                  <Mention
                    channelId={panel.channelId}
                    onDelete={() => {
                      if (!panel) return false;
                      panel.channelId = undefined;
                      panel.messageId = undefined;
                      return true;
                    }}
                  />
                {/if}
              </Field.Field>
            </Tabs.Content>
            <Tabs.Content value="edit">
              <Field.Field>
                <Field.Label>Message Link</Field.Label>
                <Input
                  type="text"
                  placeholder="Enter the link to the message to edit"
                  value={panel.messageId
                    ? `https://discord.com/channels/${page.params.guildid}/${panel.channelId}/${panel.messageId}`
                    : ""}
                  oninput={(e) => {
                    if (!panel) return;
                    const value = e.currentTarget.value;
                    const parsed = parseDiscordLink(value);
                    if (
                      parsed &&
                      parsed.channelId &&
                      parsed.messageId &&
                      parsed.guildId === page.params.guildid
                    ) {
                      panel.channelId = parsed.channelId;
                      panel.messageId = parsed.messageId;
                    }
                  }}
                />
              </Field.Field>
            </Tabs.Content>
          </Tabs.Root>
          <div class="mt-3 flex justify-start">
            <Button
              variant="default"
              onclick={sendPanel}
              showLoading={sending}
              disabled={sending || !panel.channelId}
              class="w-full"
            >
              {panel.messageId ? "Edit" : "Send"}
            </Button>
          </div>
        </Card.Content>
      </Card.Root>

      <PanelDialog bind:open={dialog.panel} bind:components={panel.data} />
    {:else}
      <div class="col-span-full text-center">
        <LoadingSpinner />
      </div>
    {/if}
  </div>
</div>
