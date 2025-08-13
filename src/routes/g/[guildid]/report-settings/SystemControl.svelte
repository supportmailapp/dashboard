<script lang="ts">
  import { page } from "$app/state";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import DateTimePicker from "$lib/components/DateTimePicker.svelte";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import { relativeDatetime } from "$lib/utils";
  import { dateToLocalString } from "$lib/utils/formatting";
  import * as Alert from "$ui/alert";
  import Separator from "$ui/separator/separator.svelte";
  import { Switch } from "$ui/switch";
  import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
  import dayjs from "dayjs";

  interface Props {
    pauseState: TPauseState;
    enabled: boolean;
    loading: boolean;
    fetchedState: APIPausedUntil;
    saveAllFn: SaveFunction;
  }

  let {
    pauseState = $bindable(),
    enabled = $bindable(),
    loading = $bindable(),
    fetchedState = $bindable(),
    saveAllFn,
  }: Props = $props();

  let showDateError = $state(false);
  let savingReportStatus = $state(false);

  const activeTabs = [
    { value: "active", label: "Active" },
    { value: "paused", label: "Paused" },
  ];
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
    saveFn={async () => await saveAllFn((v) => (loading = v))}
    saveBtnDisabled={loading}
    saveBtnLoading={loading}
  >
    <!-- Report Status Section -->
    <div class="flex flex-col items-start gap-2">
      <Label class="inline-flex w-full items-center gap-2">
        <Switch variant="success" bind:checked={enabled} disabled={savingReportStatus} />
        {enabled ? "Enabled" : "Disabled"}
      </Label>
    </div>

    <Separator class="my-3" />

    <!-- Pausing Section -->
    <div class="space-y-4">
      <div>
        <h3 class="text-lg font-medium">Pausing Controls</h3>
        <p class="text-muted-foreground text-sm">Pausing won't reset any settings.</p>
      </div>

      <!-- Tabs control 'isActive' -->
      <RadioGroup.Root
        orientation="horizontal"
        class="flex flex-row gap-8"
        bind:value={
          () => (pauseState.pausedUntil.value ? "paused" : "active"),
          (val) => (pauseState.pausedUntil.value = val === "paused")
        }
      >
        {#each activeTabs as tab}
          <div class="inline-flex cursor-pointer items-center gap-2 py-1 *:cursor-pointer">
            <RadioGroup.Item value={tab.value} id={tab.value} class="size-5" />
            <Label for={tab.value} class="text-lg">{tab.label}</Label>
          </div>
        {/each}
      </RadioGroup.Root>
      {#if !pauseState.pausedUntil.value}
        <div class="flex-1 space-y-4 outline-none">
          <p>Reports are <strong>active</strong>, users can create reports.</p>
        </div>
      {:else}
        <div class="flex-1 space-y-4 outline-none">
          <p>Reports are <strong>paused</strong>, users <strong>cannot</strong> create new reports.</p>
          <!-- Radio group controls 'pauseType' -->
          <RadioGroup.Root
            bind:value={
              () => pauseState.type,
              (val) => {
                pauseState.type = val;
                if (val === "indefinite") {
                  pauseState.pausedUntil.date = null;
                }
              }
            }
          >
            <div class="flex items-center space-x-2">
              <RadioGroup.Item value="indefinite" id="indefinite" class="size-5" />
              <Label for="indefinite" class="text-base">Indefinitely</Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroup.Item value="timed" id="timed" class="size-5" />
              <Label for="timed" class="text-base">Until Date/Time</Label>
            </div>
          </RadioGroup.Root>
          {#if pauseState?.type === "timed"}
            <div class="flex flex-col gap-1">
              <Label>Until when?</Label>
              <DateTimePicker
                showError={showDateError}
                onChange={(val: string) => {
                  const djs = dayjs(val);
                  console.log(djs.toString());
                  if (djs.isValid()) {
                    pauseState.pausedUntil.date = val; // val is an ISOString
                  } else if (!pauseState) {
                    console.warn("Pause State not initialized???");
                  }
                }}
              />
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </ConfigCard>
</div>