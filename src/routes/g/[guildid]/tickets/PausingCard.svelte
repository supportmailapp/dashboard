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
  import * as Tabs from "$ui/tabs";
  import dayjs from "dayjs";
  import equal from "fast-deep-equal/es6";
  import ky from "ky";
  import { toast } from "svelte-sonner";
  import { relativeDatetime } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";

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
    console.log("payload", payload);
    console.log("backup", pauseState.backup?.pausedUntil);
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
    if (typeof fetchedState === "undefined") fetchedState = pausedUntil;
  });
</script>

{#if fetchedState?.value}
  {@const pausedDate = fetchedState.date ? new Date(fetchedState.date) : null}
  <Alert.Root variant="destructive">
    <CircleAlertIcon class="size-4" />
    <Alert.Title>Tickets are paused.</Alert.Title>
    <Alert.Description class="inline-flex">
      {#if pausedDate}
        Tickets are paused until {`${pausedDate?.toLocaleDateString(undefined, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          hourCycle: "h24",
          minute: "2-digit",
        })} (${relativeDatetime(pausedDate)}).`}
      {:else}
        Paused until manually resumed.
      {/if}
    </Alert.Description>
  </Alert.Root>
{/if}

{#if pauseState.isConfigured()}
  <ConfigCard
    title="Pausing Status"
    description="Pausing won't reset any settings."
    {saveFn}
    saveBtnDisabled={pauseState.saving}
    saveBtnLoading={pauseState.loading}
  >
    <!-- Tabs control 'isActive' -->
    <Tabs.Root
      bind:value={
        () => (pauseState.config.pausedUntil.value ? "paused" : "active"),
        (val) => (pauseState.config.pausedUntil.value = val === "paused")
      }
    >
      <Tabs.List>
        <Tabs.Trigger value="active">Active</Tabs.Trigger>
        <Tabs.Trigger value="paused">Paused</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="active" class="space-y-4">
        <p>Tickets are <strong>active</strong>, users can create tickets.</p>
      </Tabs.Content>
      <Tabs.Content value="paused" class="space-y-4">
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
      </Tabs.Content>
    </Tabs.Root>
  </ConfigCard>
{/if}
