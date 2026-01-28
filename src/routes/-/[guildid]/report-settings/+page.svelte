<script lang="ts">
  import { page } from "$app/state";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SaveAlert from "$lib/components/SaveAlert.svelte";
  import SettingsGrid from "$lib/components/SettingsGrid.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import type { DBGuildProjectionReturns } from "$lib/server/db";
  import { APIRoutes } from "$lib/urls";
  import apiClient from "$lib/utils/apiClient";
  import dayjs from "dayjs";
  import { onDestroy, untrack } from "svelte";
  import { toast } from "svelte-sonner";
  import type { PutFields } from "../../../api/v1/guilds/[guildid]/config/reports/+server";
  import ChannelSelectCard from "./ChannelSelectCard.svelte";
  import LimitsCard from "./LimitsCard.svelte";
  import MentionableSelectCard from "./MentionableSelectCard.svelte";
  import SystemControl from "./SystemControl.svelte";
  import { determineUnsavedChanges } from "$lib/utils";
  import { afterNavigate } from "$app/navigation";
  import SpecialChannelCard from "./SpecialChannelCard.svelte";

  const config = $state({
    old: null as DBGuildProjectionReturns["reportSettings"] | null,
    current: null as DBGuildProjectionReturns["reportSettings"] | null,
    saving: false,
    loading: true,
  });

  let fetchedState = $state<APIPausedUntil>({ date: null, value: false });
  let showDateError = $state(false);

  let pauseState = $state<TPauseState>({
    pausedUntil: { date: null, value: false },
    type: "indefinite",
  });

  let unsavedChanges = $derived(
    determineUnsavedChanges(
      untrack(() => config.old),
      config.current,
    ),
  );

  $inspect("current + old config", config.current, config.old);
  $inspect("unsavedChanges", unsavedChanges);

  function buildPausedUntil(_data?: TPauseState): APIPausedUntil {
    const snap = _data ?? pauseState;
    return {
      value: !!snap?.pausedUntil.value,
      date: !snap?.pausedUntil.value || !snap || snap.type === "indefinite" ? null : snap.pausedUntil.date,
    };
  }

  function setPauseState(pu: APIPausedUntil) {
    pauseState = {
      pausedUntil: { date: pu.date ?? null, value: !!pu.value },
      type: pu.date && pu.value ? "timed" : "indefinite",
    };
  }

  async function saveFn() {
    if (!config.current) {
      toast.error("No configuration to save.");
      return;
    }

    showDateError = false;
    config.saving = true;

    const current = $state.snapshot(config.current);
    const pausedPayload = buildPausedUntil();

    // Validate pause date
    if (pausedPayload.date && dayjs(pausedPayload.date).isBefore(new Date())) {
      toast.error("Cannot set a pause date in the past.", {
        description: "Please select a future date for the pause.",
      });
      showDateError = true;
      config.saving = false;
      return;
    }

    if (!unsavedChanges) {
      toast.info("Nothing to save.");
      config.saving = false;
      return;
    }

    try {
      const { pausedUntil, ...rest } = current ?? {
        channelId: null,
        actionsEnabled: false,
        enabled: false,
        limits: { opens: 20, perUserCreate: 5, perUserReceive: 1 },
        pausedUntil: {
          date: null,
          value: false,
        },
        pings: [],
      };

      const res = await apiClient.put(APIRoutes.reportsConfig(page.params.guildid!), {
        json: {
          ...rest,
          enabled: !rest.channelId ? false : rest.enabled,
          pausedUntil: pausedPayload,
        } as PutFields,
      });

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to save report configuration.");
      }

      const json = await res.json<DBGuildProjectionReturns["reportSettings"]>();
      config.old = { ...json };
      config.current = { ...json };
      setPauseState(json.pausedUntil);
      fetchedState = json.pausedUntil;

      toast.success("Report configuration saved successfully.");
    } catch (error: any) {
      toast.error(`Failed to save report configuration: ${error.message}`);
    } finally {
      config.saving = false;
    }
  }

  function resetConfig() {
    if (config.old) {
      config.current = { ...config.old };
      fetchedState = config.old.pausedUntil;
      setPauseState(config.old.pausedUntil);
    }
  }

  afterNavigate(() => {
    fetch(APIRoutes.reportsConfig(page.params.guildid!))
      .then((res) => {
        if (!res.ok) {
          toast.error("Failed to load report configuration.", {
            description: "Please try again later.",
          });
          return;
        }
        res.json().then((data: DBGuildProjectionReturns["reportSettings"]) => {
          config.old = {
            ...data,
            limits: {
              perUserReceive: data.limits?.perUserReceive ?? 1,
              perUserCreate: data.limits?.perUserCreate ?? 5,
              opens: data.limits?.opens ?? 20,
            },
          };
          config.current = { ...$state.snapshot(config.old) };
          setPauseState(data.pausedUntil);
          fetchedState = data.pausedUntil;
        });
      })
      .catch((err) => {
        toast.error("Failed to load report configuration.", {
          description: err.message,
        });
      })
      .finally(() => {
        config.loading = false;
      });
  });

  onDestroy(resetConfig);
</script>

<SiteHeading title="Report Settings" />

<SaveAlert
  saving={config.saving}
  {unsavedChanges}
  discardChanges={() => {
    if (config.old) {
      config.current = { ...config.old };
      fetchedState = config.old.pausedUntil;
      setPauseState(config.old.pausedUntil);
    }
  }}
  saveData={saveFn}
/>

<SettingsGrid class="mt-6">
  {#if config.current}
    <SystemControl
      bind:pauseState
      bind:enabled={config.current.enabled}
      bind:loading={config.loading}
      alertChannelSet={!!config.current.channelId}
      {fetchedState}
      {showDateError}
    />
    <LimitsCard
      bind:perUserReceive={config.current.limits.perUserReceive}
      bind:perUserCreate={config.current.limits.perUserCreate}
      bind:opens={config.current.limits.opens}
      bind:loading={config.loading}
    />
    <ChannelSelectCard bind:channelId={config.current.channelId} bind:loading={config.loading} />
    <MentionableSelectCard
      title="Notification Settings"
      description="Select users and roles to notify when reports are created."
      addButtonText="Add Ping"
      bind:entities={config.current.pings}
      bind:loading={config.loading}
      notFoundText="No pings configured."
    />
    <MentionableSelectCard
      title="Moderators"
      description="Select users and roles which can take action on reports."
      addButtonText="Add Moderator"
      bind:entities={config.current.mods}
      bind:loading={config.loading}
      notFoundText="No moderators configured."
    />
    <MentionableSelectCard
      title="Immune Settings"
      description="Select users and roles which cannot be reported. <b>Use with care!</b>"
      addButtonText="Add Immune Entity"
      bind:entities={config.current.immune}
      bind:loading={config.loading}
      notFoundText="No immune entities configured."
    />
    <SpecialChannelCard
      bind:setting={config.current.channels.setting}
      bind:channels={config.current.channels.ids}
      bind:loading={config.loading}
    />
  {:else}
    <div class="col-span-full flex h-48 items-center justify-center">
      <LoadingSpinner />
    </div>
  {/if}
</SettingsGrid>
