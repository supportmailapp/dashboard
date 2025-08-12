<script lang="ts">
  import { page } from "$app/state";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import DateTimePicker from "$lib/components/DateTimePicker.svelte";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import { APIRoutes } from "$lib/urls";
  import { relativeDatetime } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import { dateToLocalString } from "$lib/utils/formatting";
  import * as Alert from "$ui/alert";
  import Separator from "$ui/separator/separator.svelte";
  import { Switch } from "$ui/switch";
  import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
  import dayjs from "dayjs";
  import equal from "fast-deep-equal/es6";
  import { toast } from "svelte-sonner";

  interface Props {
    pausedUntil: APIPausedUntil;
    enabled: boolean;
    saveAllFn: SaveFunction;
  }

  let { pausedUntil = $bindable(), enabled = $bindable(), saveAllFn }: Props = $props();

  const pauseType = $state<"timed" | "indefinite">(pausedUntil.date ? "timed" : "indefinite");
  let fetchedState = $state<APIPausedUntil>($state.snapshot(pausedUntil));
  const pauseState = new ConfigState<Omit<Props, "saveAllFn"> & { type: typeof pauseType }>(
    {
      pausedUntil: pausedUntil,
      type: pauseType,
      enabled: enabled,
    },
    false,
  );
  let showDateError = $state(false);
  let savingReportStatus = $state(false);

  $inspect("pauseState", pauseState.config);

  function toPauseState(_pausedUntil: APIPausedUntil): Omit<Props, "saveAllFn"> & { type: typeof pauseType } {
    return {
      pausedUntil: _pausedUntil,
      type: _pausedUntil.date ? "timed" : "indefinite",
      enabled: enabled,
    };
  }

  function buildPausedUntil(): APIPausedUntil {
    const snap = pauseState.snap();
    console.log("snap.type", snap?.type);
    return {
      value: !!snap?.pausedUntil.value,
      date: snap?.pausedUntil.value && snap.type === "timed" ? snap.pausedUntil.date : null,
    };
  }

  function errorHintIndefiniteButNoDate() {
    showDateError = true;
  }

  // TODO: Integrate new system status into function
  // - merge api routes into one
  // - only use saveAllFn

  async function saveFn() {
    const payload = buildPausedUntil();
    if (equal(payload, pauseState.backup?.pausedUntil)) {
      toast.info("No changes to save.");
      return;
    }
    if (payload.value && pauseState.config?.type === "timed" && !payload.date) {
      errorHintIndefiniteButNoDate();
      return;
    }

    pauseState.saving = true;

    try {
      const res = await apiClient.put(APIRoutes.pausing(page.data.guildId!, "reports"), {
        json: payload,
      });

      if (!res.ok) {
        const errJson = await res.json<any>();
        const errText = errJson?.message || "Unknown Error";
        throw new Error(errText);
      }

      const jsonRes = await res.json<APIPausedUntil>();

      pauseState.saveConfig(toPauseState(jsonRes));
      fetchedState = jsonRes;
      toast.success(
        !jsonRes.value
          ? "Reports resumed (unpaused)."
          : `Reports paused${jsonRes.date ? " temporarily" : " indefinitly"}.`,
      );
    } catch (err: any) {
      toast.error("Failed to save guild configuration.", {
        description: err.message,
      });
      pauseState.saving = false;
    } finally {
      showDateError = false;
    }
  }

  $effect(() => {
    if (typeof fetchedState === "undefined") fetchedState = $state.snapshot(pausedUntil);
  });
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
  {#if pauseState.isConfigured()}
    {@const activeTabs = [
      { value: "active", label: "Active" },
      { value: "paused", label: "Paused" },
    ]}
    <ConfigCard
      rootClass="h-full"
      class="flex flex-col gap-4"
      title="System Control"
      description="Control the report system status and pausing settings."
      {saveFn}
      saveBtnDisabled={pauseState.saving}
      saveBtnLoading={pauseState.loading}
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
            () => (pauseState.config.pausedUntil.value ? "paused" : "active"),
            (val) => (pauseState.config.pausedUntil.value = val === "paused")
          }
        >
          {#each activeTabs as tab}
            <div class="inline-flex cursor-pointer items-center gap-2 py-1 *:cursor-pointer">
              <RadioGroup.Item value={tab.value} id={tab.value} class="size-5" />
              <Label for={tab.value} class="text-lg">{tab.label}</Label>
            </div>
          {/each}
        </RadioGroup.Root>
        {#if !pauseState.config.pausedUntil.value}
          <div class="flex-1 space-y-4 outline-none">
            <p>Reports are <strong>active</strong>, users can create reports.</p>
          </div>
        {:else}
          <div class="flex-1 space-y-4 outline-none">
            <p>Reports are <strong>paused</strong>, users <strong>cannot</strong> create new reports.</p>
            <!-- Radio group controls 'pauseType' -->
            <RadioGroup.Root
              bind:value={
                () => pauseState.config.type,
                (val) => {
                  pauseState.config.type = val;
                  if (val === "indefinite") {
                    pauseState.config.pausedUntil.date = null;
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
            {#if pauseState.config?.type === "timed"}
              <div class="flex flex-col gap-1">
                <Label>Until when?</Label>
                <DateTimePicker
                  showError={showDateError}
                  onChange={(val: string) => {
                    const djs = dayjs(val);
                    console.log(djs.toString());
                    if (djs.isValid()) {
                      pauseState.config.pausedUntil.date = val; // val is an ISOString
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
  {/if}
</div>
