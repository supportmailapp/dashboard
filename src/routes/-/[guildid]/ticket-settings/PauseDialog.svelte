<script lang="ts">
  import DateTimePicker from "$lib/components/DateTimePicker.svelte";
  import { Button } from "$ui/button";
  import * as Dialog from "$ui/dialog";
  import { Label } from "$ui/label/index.js";
  import * as RadioGroup from "$ui/radio-group/index.js";
  import dayjs from "dayjs";

  interface Props {
    open: boolean;
    pausedUntil: APIPausedUntil;
    showDateError: boolean;
    onOpenChange: (open: boolean) => void;
  }

  let {
    open = $bindable(),
    pausedUntil = $bindable(),
    showDateError,
    onOpenChange,
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

<Dialog.Root {open} {onOpenChange}>
  <Dialog.Content class="max-w-lg">
    <Dialog.Header>
      <Dialog.Title>Pausing Controls</Dialog.Title>
      <Dialog.Description>
        Configure ticket system pause settings. Pausing won't reset any settings.
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
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

    <Dialog.Footer>
      <Button variant="outline" onclick={() => onOpenChange(false)}>Close</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
