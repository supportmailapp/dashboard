<script lang="ts">
  import { page } from "$app/state";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import DateTimePicker from "$lib/components/DateTimePicker.svelte";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import { APIRoutes } from "$lib/urls";
  import * as Alert from "$ui/alert";
  import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
  import dayjs from "dayjs";
  import equal from "fast-deep-equal/es6";
  import { toast } from "svelte-sonner";
  import { relativeDatetime } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import { dateToLocalString } from "$lib/utils/formatting";

  interface Props {
    pausedUntil: APIPausedUntil;
  }

  let { pausedUntil = $bindable() }: Props = $props();

  const pauseType = $state<"timed" | "indefinite">(pausedUntil.date ? "timed" : "indefinite");
  let fetchedState = $state<APIPausedUntil>($state.snapshot(pausedUntil));
  const pauseState = new ConfigState<Props & { type: typeof pauseType }>(
    {
      pausedUntil: pausedUntil,
      type: pauseType,
    },
    false,
  );
  let showDateError = $state(false);

  $inspect("pauseState", pauseState.config);

  function toPauseState(_pausedUntil: APIPausedUntil): Props & { type: typeof pauseType } {
    return {
      pausedUntil: _pausedUntil,
      type: _pausedUntil.date ? "timed" : "indefinite",
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
      const res = await apiClient.put(APIRoutes.pausing(page.data.guildId!, "tickets"), {
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
          ? "Tickets resumed (unpaused)."
          : `Tickets paused${jsonRes.date ? " temporarily" : " indefinitly"}.`,
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

<div class="col-span-full flex max-w-4xl flex-col gap-2 lg:col-span-3">
  {#if pauseState.isConfigured()}
    {@const activeTabs = [
      { value: "active", label: "Active" },
      { value: "paused", label: "Paused" },
    ]}
    <ConfigCard
      class="flex flex-col gap-4"
      title="Pausing Status"
      description="Pausing won't reset any settings."
      {saveFn}
      saveBtnDisabled={pauseState.saving}
      saveBtnLoading={pauseState.loading}
    >
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
          <p>Tickets are <strong>active</strong>, users can create tickets.</p>
        </div>
      {:else}
        <div class="flex-1 space-y-4 outline-none">
          <p>Tickets are <strong>paused</strong>, users <strong>cannot</strong> create new tickets.</p>
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
              <RadioGroup.Item value="indefinite" id="indefinite" />
              <Label for="indefinite">Indefinitly</Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroup.Item value="timed" id="timed" />
              <Label for="timed">Until Date/Time</Label>
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
    </ConfigCard>
  {/if}
</div>
