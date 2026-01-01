<script lang="ts">
  import { page } from "$app/state";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SettingsGrid from "$lib/components/SettingsGrid.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import type { DBGuildProjectionReturns } from "$lib/server/db";
  import { APIRoutes } from "$lib/urls";
  import { deepClone } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import Separator from "$ui/separator/separator.svelte";
  import dayjs from "dayjs";
  import equal from "fast-deep-equal/es6";
  import { onDestroy, onMount, untrack } from "svelte";
  import { toast } from "svelte-sonner";
  import type { TicketsPUTFields } from "../../../api/v1/guilds/[guildid]/config/tickets/+server";
  import AnonymSettings from "./AnonymSettings.svelte";
  import MessageHandling from "./MessageHandling.svelte";
  import ResetStuff from "./ResetStuff.svelte";
  import SystemControl from "./SystemControl.svelte";
  import TicketForumCard from "./TicketForumCard.svelte";

  type TicketConfig = DBGuildProjectionReturns["generalTicketSettings"];

  const config = $state({
    old: null as TicketConfig | null,
    current: null as TicketConfig | null,
    saving: false,
    loading: true,
  });

  let fetchedPauseState = $state<APIPausedUntil>({
    date: null,
    value: false,
  });

  let showDateError = $state(false);
  let unsavedChanges = $derived(!equal(untrack(() => config.old), config.current));

  function errorHintTimedButNoDate() {
    toast.error("Cannot set timed pause without a date.", {
      description: "Please select a date or change the pause type.",
    });
    showDateError = true;
  }

  const saveAll: SaveFunction = async function (setLoading, callback) {
    showDateError = false;

    setLoading(true);

    const current = $state.snapshot(config.current);
    const pausedPayload = current?.pausedUntil ?? { date: null, value: false };

    // Store original states for comparison
    const originalPausedState = deepClone($state.snapshot(fetchedPauseState));
    const originalConfig = deepClone(config.old);

    console.log("paused payload", pausedPayload);

    // Check for timed pause without a date
    if (pausedPayload.value && !pausedPayload.date) {
      // This is fine - it means indefinite pause
    } else if (pausedPayload.date && dayjs(pausedPayload.date).isBefore(new Date())) {
      toast.error("Cannot set a pause date in the past.", {
        description: "Please select a future date for the pause.",
      });
      showDateError = true;
      setLoading(false);
      return;
    }

    if (!unsavedChanges) {
      toast.info("Nothing to save.");
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

      const json = await res.json<TicketConfig>();
      config.old = { ...json };
      config.current = { ...json };
      fetchedPauseState = json.pausedUntil;

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

  function resetConfig() {
    if (config.old) {
      config.current = { ...config.old };
    }
  }

  onMount(async () => {
    try {
      const res = await fetch(APIRoutes.ticketsConfig(page.data.guildId!));

      if (!res.ok) {
        toast.error("Failed to load ticket configuration.", {
          description: "Please try again later.",
        });
        return;
      }

      const jsonRes: TicketConfig = await res.json();
      config.old = { ...jsonRes };
      config.current = { ...jsonRes };
      fetchedPauseState = jsonRes.pausedUntil;
    } catch (err: any) {
      toast.error("Failed to load ticket configuration.", {
        description: err.message,
      });
    } finally {
      config.loading = false;
    }
  });

  onDestroy(resetConfig);
</script>

<SiteHeading title="Ticket Settings" />

<SettingsGrid class="mt-6">
  {#if config.current}
    <SystemControl
      bind:pausedUntil={config.current.pausedUntil}
      bind:enabled={config.current.enabled}
      loading={config.saving}
      fetchedState={fetchedPauseState}
      {showDateError}
      saveAllFn={saveAll}
    />
    <MessageHandling
      bind:allowedBots={config.current.allowedBots}
      bind:autoForward={config.current.autoForwarding}
      saveAllFn={saveAll}
    />
    <TicketForumCard
      forumId={config.current.forumId ?? null}
      wholeConfig={config}
      saveAllFn={saveAll}
    />
    <AnonymSettings bind:anonymSettings={config.current.anonym} saveAllFn={saveAll} />
    <Separator class="col-span-full my-5" />
    <ResetStuff />
  {:else}
    <div class="grid place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
</SettingsGrid>
