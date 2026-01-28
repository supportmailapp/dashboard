<script lang="ts">
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import { relativeDatetime } from "$lib/utils";
  import { dateToLocalString } from "$lib/utils/formatting";
  import * as Alert from "$ui/alert/index.js";
  import * as Tooltip from "$ui/tooltip/index.js";
  import * as Field from "$ui/field/index.js";
  import * as Select from "$ui/select/index.js";
  import * as Popover from "$ui/popover/index.js";
  import { Label } from "$ui/label/index.js";
  import Separator from "$ui/separator/separator.svelte";
  import { Switch } from "$ui/switch";
  import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
  import PauseDialog from "../ticket-settings/PauseDialog.svelte";
  import Button, { buttonVariants } from "$ui/button/button.svelte";
  import ChannelSelect from "$lib/components/discord/ChannelSelect.svelte";
  import { ChannelType } from "discord-api-types/v10";
  import Mention from "$lib/components/discord/Mention.svelte";

  interface Props {
    channelId: string | null;
    pauseState: TPauseState;
    enabled: boolean;
    actionsEnabled: boolean;
    autoResolve: boolean;
    loading: boolean;
    fetchedState: APIPausedUntil;
    showDateError: boolean;
    alertChannelSet: boolean;
  }

  let {
    channelId = $bindable(),
    pauseState = $bindable(),
    enabled = $bindable(),
    actionsEnabled = $bindable(),
    autoResolve = $bindable(),
    loading = $bindable(),
    fetchedState = $bindable(),
    showDateError,
    alertChannelSet,
  }: Props = $props();

  let dialogOpen = $state(false);
  let channelDialogOpen = $state(false);

  function syncPauseType() {
    pauseState.type = pauseState.pausedUntil.date && pauseState.pausedUntil.value ? "timed" : "indefinite";
  }
</script>

{#if fetchedState?.value}
  {@const pausedDate = fetchedState.date ? new Date(fetchedState.date) : null}
  <Alert.Root variant="warning" class="col-span-full">
    <CircleAlertIcon class="size-4" />
    <Alert.Title>Reports are paused.</Alert.Title>
    <Alert.Description class="inline-flex">
      {#if pausedDate}
        Reports are paused until {`${dateToLocalString(pausedDate)} (${relativeDatetime(pausedDate)}).`}
      {:else}
        Paused until manually resumed.
      {/if}
    </Alert.Description>
  </Alert.Root>
{/if}

<div class="col-span-full flex flex-col gap-2 lg:col-span-3">
  <ConfigCard
    rootClass="h-full"
    class="flex flex-col gap-4"
    title="System Control"
    description="Control the report system status and pausing settings."
    saveBtnDisabled={loading}
    saveBtnLoading={loading}
  >
    <!-- Report Status Section -->
    <div class="flex flex-col items-start gap-2">
      <Tooltip.Root disabled={alertChannelSet} disableCloseOnTriggerClick={true}>
        <Tooltip.Trigger>
          <Label class="inline-flex w-full items-center gap-2">
            <Switch
              bind:checked={() => (alertChannelSet ? enabled : false), (v) => (enabled = v)}
              disabled={loading || !alertChannelSet}
            />
            {enabled ? "Enabled" : "Disabled"}
          </Label>
        </Tooltip.Trigger>
        <Tooltip.Content>Setup an alert channel first, before enabling the report system.</Tooltip.Content>
      </Tooltip.Root>
    </div>

    <Separator class="my-3" />

    <!-- Pausing Section -->
    <Field.Group>
      <Field.Field orientation="responsive">
        <Field.Content>
          <Field.Label>Alert Channel</Field.Label>
          <Field.Description>
            The channel where report alerts will be sent.<br />
            Reports cannot be created without an alert channel.
          </Field.Description>
        </Field.Content>
        {#if !channelId}
          <Popover.Root bind:open={channelDialogOpen}>
            <Popover.Trigger class={buttonVariants({ variant: "outline" })} disabled={!!loading}>
              Select Channel
            </Popover.Trigger>
            <Popover.Content class="w-80">
              <div class="h-100 w-full max-w-100">
                <ChannelSelect
                  selectedId={channelId ?? undefined}
                  channelTypes={[
                    ChannelType.GuildText,
                    ChannelType.GuildVoice,
                    ChannelType.GuildAnnouncement,
                    ChannelType.GuildStageVoice,
                    ChannelType.GuildForum,
                  ]}
                  allowCustomChannels
                  excludedChannelIds={channelId ? [channelId] : []}
                  onSelect={(c) => {
                    channelId = c.id;
                    channelDialogOpen = false;
                  }}
                />
              </div>
            </Popover.Content>
          </Popover.Root>
        {:else}
          <Mention
            {channelId}
            onDelete={() => {
              channelId = null;
              return true;
            }}
          />
        {/if}
      </Field.Field>

      <Field.Field orientation="responsive">
        <Field.Content>
          <Field.Label class="text-lg font-medium">Pausing Controls</Field.Label>
          <Field.Description class="text-muted-foreground text-sm">
            Pausing won't reset any settings.
          </Field.Description>
          <div class="space-y-1">
            <p class="text-sm font-medium">
              Status: <span class="text-muted-foreground">
                {#if pauseState.pausedUntil.value}
                  {#if pauseState.pausedUntil.date}
                    {@const pausedDate = new Date(pauseState.pausedUntil.date)}
                    Paused until {dateToLocalString(pausedDate)}
                  {:else}
                    Paused indefinitely
                  {/if}
                {:else}
                  Active
                {/if}
              </span>
            </p>
            {#if !alertChannelSet && pauseState.pausedUntil.value}
              <p class="text-destructive text-sm">
                <CircleAlertIcon class="mr-1 inline-block size-4" />
                You need to set an alert channel before pausing works.
              </p>
            {/if}
          </div>
        </Field.Content>
        <Button variant="outline" onclick={() => (dialogOpen = true)}>Configure Pause Settings</Button>
      </Field.Field>

      <Field.Field orientation="horizontal">
        <Field.Content>
          <Field.Label>Actions</Field.Label>
          <Field.Description>
            Enable or disable actions for reports.<br />
            When disabled, moderators won't be able to take any actions on reports with SupportMail.
          </Field.Description>
        </Field.Content>
        <div>
          <Switch bind:checked={actionsEnabled} disabled={loading} />
        </div>
      </Field.Field>

      <Field.Field orientation="responsive">
        <Field.Content>
          <Field.Label>Automatic Resolution</Field.Label>
          <Field.Description>
            Automatically resolve reports when they are created.<br />
            This is helpful when you have actions turned off.
          </Field.Description>
        </Field.Content>
        <Select.Root
          type="single"
          bind:value={() => String(autoResolve), (v) => (autoResolve = JSON.parse(v))}
        >
          <Select.Trigger class={buttonVariants({ variant: "outline" })}>
            {autoResolve ? "Enabled" : "Disabled"}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="true">Resolve Reports instantly</Select.Item>
            <Select.Item value="false">Let mods resolve reports</Select.Item>
          </Select.Content>
        </Select.Root>
      </Field.Field>
    </Field.Group>
  </ConfigCard>
</div>

<PauseDialog
  bind:open={dialogOpen}
  bind:pausedUntil={pauseState.pausedUntil}
  {showDateError}
  onOpenChange={(open) => {
    dialogOpen = open;
    if (!open) {
      syncPauseType();
    }
  }}
/>
