<script lang="ts">
  import { page } from "$app/state";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SettingsGrid from "$lib/components/SettingsGrid.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import type { DBGuildProjectionReturns } from "$lib/server/db";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import { APIRoutes } from "$lib/urls";
  import apiClient from "$lib/utils/apiClient";
  import Separator from "$ui/separator/separator.svelte";
  import equal from "fast-deep-equal/es6";
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import type { TicketsPUTFields } from "../../../api/v1/guilds/[guildid]/config/tickets/+server";
  import AnonymSettings from "./AnonymSettings.svelte";
  import MessageHandling from "./MessageHandling.svelte";
  import ResetStuff from "./ResetStuff.svelte";
  import SystemControl from "./SystemControl.svelte";
  import TicketForumCard from "./TicketForumCard.svelte";
  import { deepClone } from "$lib/utils";
  import dayjs from "dayjs";

  const generalTicketsConf = new ConfigState<DBGuildProjectionReturns["generalTicketSettings"]>();
  const pauseState = new ConfigState<TPauseState>({
    enabled: false,
    pausedUntil: { date: null, value: false },
    type: "indefinite",
  });
  let fetchedState = $state<APIPausedUntil>({
    date: null,
    value: false,
  });

  $inspect("config", generalTicketsConf.config);

  function errorHintTimedButNoDate() {
    toast.error("Cannot set timed pause without a date.", {
      description: "Please select a date or change the pause type.",
    });
  }

  function setPauseState(pu: APIPausedUntil) {
    pauseState.saveConfig({
      pausedUntil: pu,
      enabled: pu.value,
      type: pu.date && pu.value ? "timed" : "indefinite", // ? Really && or is just the check for the date enough?
    });
  }

  function buildPausedUntil(_data?: TPauseState): APIPausedUntil {
    const snap = _data ?? pauseState.snap();
    return {
      value: !!snap?.pausedUntil.value,
      date: snap?.pausedUntil.value && snap.type === "timed" ? snap.pausedUntil.date : null,
    };
  }

  const saveAll: SaveFunction = async function (setLoading, callback) {
    if (generalTicketsConf.config) {
      generalTicketsConf.config.pausedUntil = buildPausedUntil();
    }

    if (!generalTicketsConf.evalUnsaved()) {
      toast.info("Nothing to save.");
      return;
    }

    setLoading(true);

    const current = $state.snapshot(generalTicketsConf.config);
    const pausedPayload = buildPausedUntil();
    const oldPausedUntil = pauseState.snap();

    // Store original states for comparison
    const originalPausedState = deepClone(fetchedState);
    const originalConfig = deepClone(generalTicketsConf.backup);

    if (oldPausedUntil?.type === "timed" && !pausedPayload.date) {
      errorHintTimedButNoDate();
      setLoading(false);
      return;
    } else if (dayjs(pausedPayload.date).isBefore(new Date())) {
      toast.error("Cannot set a pause date in the past.", {
        description: "Please select a future date for the pause.",
      });
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.put(APIRoutes.ticketsConfig(page.data.guildId!), {
        json: {
          allowedBots: current?.allowedBots,
          enabled: current?.enabled,
          anonym: {
            enabled: !!current?.anonym.enabled,
            user: !!current?.anonym.user,
          },
          autoForwarding: current?.autoForwarding,
          pausedUntil: pausedPayload,
        } as TicketsPUTFields,
      });

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to save ticket configuration.");
      }

      const json = await res.json<DBGuildProjectionReturns["generalTicketSettings"]>();
      generalTicketsConf.saveConfig(json);
      setPauseState(json.pausedUntil);
      fetchedState = json.pausedUntil;

      // Determine what actually changed
      const pauseStatusChanged = originalPausedState.value !== json.pausedUntil.value;
      const pauseDateChanged = originalPausedState.date !== json.pausedUntil.date;
      const configChanged = !equal(originalConfig, json);

      let description: string | undefined;

      if (pauseStatusChanged) {
        description = json.pausedUntil.value ? "Tickets paused." : "Tickets resumed.";
      } else if (pauseDateChanged && json.pausedUntil.value) {
        description = "Pause schedule updated.";
      } else if (configChanged) {
        description = "Configuration updated successfully.";
      }

      toast.success("Ticket configuration saved successfully.", {
        description,
      });

      callback?.(json);
    } catch (error: any) {
      toast.error(`Failed to save ticket configuration: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    fetch(APIRoutes.ticketsConfig(page.data.guildId!))
      .then((res) => {
        if (!res.ok) {
          toast.error("Failed to load ticket configuration.", {
            description: "Please try again later.",
          });
          return;
        }
        res.json().then((jsonRes: DBGuildProjectionReturns["generalTicketSettings"]) => {
          generalTicketsConf.saveConfig(jsonRes);
          setPauseState(jsonRes.pausedUntil);
          fetchedState = jsonRes.pausedUntil;
        });
      })
      .catch((err) => {
        toast.error("Failed to load ticket configuration.", {
          description: err.message,
        });
      });

    return () => {
      console.log("Cleaning up ticket configuration state");
      generalTicketsConf.clear();
    };
  });
</script>

<SiteHeading title="Ticket Settings" />

<SettingsGrid class="mt-6">
  {#if generalTicketsConf.isConfigured() && pauseState.isConfigured()}
    <SystemControl
      bind:pauseState={pauseState.config}
      bind:enabled={generalTicketsConf.config.enabled}
      bind:loading={generalTicketsConf.loading}
      {fetchedState}
      saveAllFn={saveAll}
    />
    <MessageHandling
      bind:allowedBots={generalTicketsConf.config.allowedBots}
      bind:autoForward={generalTicketsConf.config.autoForwarding}
      saveAllFn={saveAll}
    />
    <TicketForumCard
      forumId={generalTicketsConf.config.forumId ?? null}
      wholeConfig={generalTicketsConf}
      saveAllFn={saveAll}
    />
    <AnonymSettings bind:anonymSettings={generalTicketsConf.config.anonym} saveAllFn={saveAll} />
    <Separator class="col-span-full my-5" />
    <ResetStuff />
  {:else}
    <div class="grid place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
</SettingsGrid>
