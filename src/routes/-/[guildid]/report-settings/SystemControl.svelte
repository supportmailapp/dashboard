<script lang="ts">
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import { relativeDatetime } from "$lib/utils";
  import { dateToLocalString } from "$lib/utils/formatting";
  import * as Alert from "$ui/alert/index.js";
  import { Label } from "$ui/label/index.js";
  import * as Tooltip from "$ui/tooltip/index.js";
  import Separator from "$ui/separator/separator.svelte";
  import { Switch } from "$ui/switch";
  import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
  import PauseDialog from "../ticket-settings/PauseDialog.svelte";
  import Button from "$ui/button/button.svelte";

  interface Props {
    pauseState: TPauseState;
    enabled: boolean;
    loading: boolean;
    fetchedState: APIPausedUntil;
    showDateError: boolean;
    alertChannelSet: boolean;
  }

  let {
    pauseState = $bindable(),
    enabled = $bindable(),
    loading = $bindable(),
    fetchedState = $bindable(),
    showDateError,
    alertChannelSet,
  }: Props = $props();

  let dialogOpen = $state(false);

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
            <Switch variant="success" bind:checked={() => (alertChannelSet ? enabled : false), (v) => (enabled = v)} disabled={loading || !alertChannelSet} />
            {enabled ? "Enabled" : "Disabled"}
          </Label>
        </Tooltip.Trigger>
        <Tooltip.Content>
          Setup an alert channel first, before enabling the report system.
        </Tooltip.Content>
      </Tooltip.Root>
    </div>

    <Separator class="my-3" />

    <!-- Pausing Section -->
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-medium">Pausing Controls</h3>
        <p class="text-muted-foreground text-sm">Pausing won't reset any settings.</p>
      </div>

      <div class="flex items-center justify-between">
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
        </div>
        <Button variant="outline" onclick={() => (dialogOpen = true)}>
          Configure Pause Settings
        </Button>
      </div>
    </div>
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
