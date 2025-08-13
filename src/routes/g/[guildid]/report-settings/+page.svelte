<script lang="ts">
  import { page } from "$app/state";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SettingsGrid from "$lib/components/SettingsGrid.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import type { DBGuildProjectionReturns } from "$lib/server/db";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import { APIRoutes } from "$lib/urls";
  import { deepClone } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import dayjs from "dayjs";
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import type { PutFields } from "../../../api/v1/guilds/[guildid]/config/reports/+server";
  import ChannelSelectCard from "./ChannelSelectCard.svelte";
  import LimitsCard from "./LimitsCard.svelte";
  import MentionableSelectCard from "./MentionableSelectCard.svelte";
  import SystemControl from "./SystemControl.svelte";
  import equal from "fast-deep-equal/es6";

  const reportsConfig = new ConfigState<DBGuildProjectionReturns["reportSettings"]>();
  const pauseState = new ConfigState<TPauseState>({
    pausedUntil: { date: null, value: false },
    type: "indefinite",
  });
  let showDateError = $state(false);

  let reportChannel = $state<GuildCoreChannel | undefined>();
  let fetchedState = $state<APIPausedUntil>({
    date: null,
    value: false,
  });

  $inspect("config", reportsConfig.config);
  $inspect("pauseState", pauseState.config);

  function errorHintTimedButNoDate() {
    toast.error("Cannot set timed pause without a date.", {
      description: "Please select a date or change the pause type.",
    });
    showDateError = true;
  }

  function setPauseState(pu: APIPausedUntil) {
    pauseState.saveConfig({
      pausedUntil: pu,
      type: pu.date && pu.value ? "timed" : "indefinite",
    });
  }

  function buildPausedUntil(_data?: TPauseState): APIPausedUntil {
    const snap = _data ?? pauseState.snap();
    return {
      value: !!snap?.pausedUntil.value,
      date: !snap?.pausedUntil.value || !snap || snap.type === "indefinite" ? null : snap.pausedUntil.date,
    };
  }

  const saveAll: SaveFunction = async function (setLoading, callback) {
    showDateError = false;
    if (reportsConfig.config) {
      reportsConfig.config.pausedUntil = buildPausedUntil();
    }

    setLoading(true);

    const current = $state.snapshot(reportsConfig.config);
    const pausedPayload = buildPausedUntil();
    const oldPausedUntil = pauseState.snap();

    // Store original states for comparison
    const originalPausedState = deepClone($state.snapshot(fetchedState));
    const originalConfig = deepClone(reportsConfig.backup);

    console.log("paused payload", pausedPayload);

    if (oldPausedUntil?.type === "timed" && !pausedPayload.date) {
      errorHintTimedButNoDate();
      setLoading(false);
      return;
    } else if (pausedPayload.date && dayjs(pausedPayload.date).isBefore(new Date())) {
      toast.error("Cannot set a pause date in the past.", {
        description: "Please select a future date for the pause.",
      });
      showDateError = true;
      setLoading(false);
      return;
    }

    if (!reportsConfig.evalUnsaved()) {
      toast.info("Nothing to save.");
      setLoading(false);
      return;
    }

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

    try {
      const res = await apiClient.put(APIRoutes.reportsConfig(page.data.guildId!), {
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
      reportsConfig.saveConfig(json);
      setPauseState(json.pausedUntil);
      fetchedState = json.pausedUntil;

      // Determine what actually changed
      const pauseStatusChanged = originalPausedState.value !== json.pausedUntil.value;
      const pauseDateChanged = originalPausedState.date !== json.pausedUntil.date;
      const configChanged = !equal(originalConfig, json);

      let description: string | undefined;

      if (pauseStatusChanged) {
        description = json.pausedUntil.value ? "Reports paused." : "Reports resumed.";
      } else if (pauseDateChanged && json.pausedUntil.value) {
        description = "Pause schedule updated.";
      } else if (configChanged) {
        description = "Configuration updated successfully.";
      }

      toast.success("Report configuration saved successfully.", {
        description,
      });

      callback?.(json);
    } catch (error: any) {
      toast.error(`Failed to save report configuration: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  function setChannel(channelId?: string) {
    reportChannel = channelId ? page.data.guildsManager.channels?.find((c) => c.id === channelId) : undefined;
  }

  onMount(() => {
    fetch(APIRoutes.reportsConfig(page.data.guildId!))
      .then((res) => {
        if (!res.ok) {
          toast.error("Failed to load report configuration.", {
            description: "Please try again later.",
          });
          return;
        }
        res.json().then((data: DBGuildProjectionReturns["reportSettings"]) => {
          reportsConfig.saveConfig({
            ...data,
            limits: {
              perUserReceive: data.limits?.perUserReceive ?? 1,
              perUserCreate: data.limits?.perUserCreate ?? 5,
              opens: data.limits?.opens ?? 20,
            },
          });
          setPauseState(data.pausedUntil);
          fetchedState = data.pausedUntil;
          setChannel(reportsConfig.config?.channelId ?? undefined);
        });
      })
      .catch((err) => {
        toast.error("Failed to load report configuration.", {
          description: err.message,
        });
      });

    return () => {
      console.log("Cleaning up report configuration state");
      reportsConfig.clear();
    };
  });
</script>

<SiteHeading title="Report Settings" />

<SettingsGrid class="mt-6">
  {#if reportsConfig.isConfigured() && pauseState.isConfigured()}
    <SystemControl
      bind:pauseState={pauseState.config}
      bind:enabled={reportsConfig.config.enabled}
      bind:loading={reportsConfig.loading}
      {fetchedState}
      {showDateError}
      saveAllFn={saveAll}
    />
    <LimitsCard bind:limits={reportsConfig.config.limits} loading={reportsConfig.loading} saveFn={saveAll} />
    <ChannelSelectCard
      bind:channel={
        () => reportChannel ?? undefined,
        (c) => {
          reportChannel = c;
          reportsConfig.config.channelId = c?.id ?? null;
          if (!c) {
            reportsConfig.config.enabled = false; // Disable reports if no channel is selected
          }
        }
      }
      bind:loading={reportsConfig.loading}
      saveFn={saveAll}
    />
    <MentionableSelectCard
      title="Notification Settings"
      description="Select users and roles to notify when reports are created."
      addButtonText="Add Ping"
      bind:entities={reportsConfig.config.pings}
      bind:loading={reportsConfig.loading}
      notFoundText="No pings configured."
      saveFn={saveAll}
    />
    <MentionableSelectCard
      title="Immune Settings"
      description="Select users and roles which cannot be reported. **Use with care!**"
      addButtonText="Add Immune Entity"
      bind:entities={reportsConfig.config.immune}
      bind:loading={reportsConfig.loading}
      notFoundText="No immune entities configured."
      saveFn={saveAll}
    />
    <MentionableSelectCard
      title="Moderator Settings"
      description="Select users and roles which can take action on reports."
      addButtonText="Add Moderator"
      bind:entities={reportsConfig.config.mods}
      bind:loading={reportsConfig.loading}
      notFoundText="No moderators configured."
      saveFn={saveAll}
    />
  {:else}
    <div class="grid place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
</SettingsGrid>
