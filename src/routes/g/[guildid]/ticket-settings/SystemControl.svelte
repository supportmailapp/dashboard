<script lang="ts">
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import DateTimePicker from "$lib/components/DateTimePicker.svelte";
  import { relativeDatetime } from "$lib/utils";
  import { dateToLocalString } from "$lib/utils/formatting";
  import * as Alert from "$ui/alert";
  import { Label } from "$ui/label/index.js";
  import * as RadioGroup from "$ui/radio-group/index.js";
  import Separator from "$ui/separator/separator.svelte";
  import { Switch } from "$ui/switch";
  import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
  import dayjs from "dayjs";

  // TODO: make paused until a dialog instead of inline in system control. The system control should just display the current pause state and have a button to open the dialog

  interface Props {
    pausedUntil: APIPausedUntil;
    enabled: boolean;
    loading: boolean;
    fetchedState: APIPausedUntil;
    showDateError: boolean;
    saveAllFn: SaveFunction;
  }

  let {
    pausedUntil = $bindable(),
    enabled = $bindable(),
    loading,
    fetchedState,
    showDateError,
    saveAllFn,
  }: Props = $props();

  // Internal state for pause type (timed vs indefinite)
  let pauseType = $state<"timed" | "indefinite">(
    pausedUntil.date && pausedUntil.value ? "timed" : "indefinite"
  );

  // Track if paused (for the active/paused toggle)
  let isPaused = $derived(pausedUntil.value);

  const activeTabs = [
    { value: "active", label: "Active" },
    { value: "paused", label: "Paused" },
  ];

  function setActiveState(val: string) {
    pausedUntil.value = val === "paused";
    if (val === "active") {
      pausedUntil.date = null;
      pauseType = "indefinite";
    }
  }

  function setPauseType(val: "timed" | "indefinite") {
    pauseType = val;
    if (val === "indefinite") {
      pausedUntil.date = null;
    }
  }

  function setDate(val: string) {
    const djs = dayjs(val);
    if (djs.isValid()) {
      pausedUntil.date = val;
    }
  }
</script>

{#if fetchedState?.value}
  {@const pausedDate = fetchedState.date ? new Date(fetchedState.date) : null}
  <Alert.Root variant="warning" class="col-span-full">
    <CircleAlertIcon class="size-4" />
    <Alert.Title>Tickets are paused.</Alert.Title>
    <Alert.Description class="inline-flex">
      {#if pausedDate}
        Tickets are paused until {`${dateToLocalString(pausedDate)} (${relativeDatetime(pausedDate)}).`}
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
    description="Control the ticket system status and pausing settings."
    saveFn={async () => await saveAllFn((v) => (loading = v))}
    saveBtnDisabled={loading}
    saveBtnLoading={loading}
  >
    <!-- Ticket Status Section -->
    <div class="flex flex-col items-start gap-2">
      <Label class="inline-flex w-full items-center gap-2">
        <Switch variant="success" bind:checked={enabled} disabled={loading} />
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
        value={isPaused ? "paused" : "active"}
        onValueChange={setActiveState}
      >
        {#each activeTabs as tab}
          <div class="inline-flex cursor-pointer items-center gap-2 py-1 *:cursor-pointer">
            <RadioGroup.Item value={tab.value} id={tab.value} class="size-5" />
            <Label for={tab.value} class="text-lg">{tab.label}</Label>
          </div>
        {/each}
      </RadioGroup.Root>
      {#if !isPaused}
        <div class="flex-1 space-y-4 outline-none">
          <p>Tickets are <strong>active</strong>, users can create tickets.</p>
        </div>
      {:else}
        <div class="flex-1 space-y-4 outline-none">
          <p>Tickets are <strong>paused</strong>, users <strong>cannot</strong> create new tickets.</p>
          <!-- Radio group controls 'pauseType' -->
          <RadioGroup.Root
            value={pauseType}
            onValueChange={(val) => setPauseType(val as "timed" | "indefinite")}
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
          {#if pauseType === "timed"}
            <div class="flex flex-col gap-1">
              <Label>Until when?</Label>
              <DateTimePicker
                showError={showDateError}
                onChange={setDate}
              />
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </ConfigCard>
</div>
