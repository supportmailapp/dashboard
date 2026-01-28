<script lang="ts">
  import { page } from "$app/state";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SaveAlert from "$lib/components/SaveAlert.svelte";
  import SettingsGrid from "$lib/components/SettingsGrid.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import type { DBGuildProjectionReturns } from "$lib/server/db";
  import { APIRoutes } from "$lib/urls";
  import apiClient from "$lib/utils/apiClient";
  import Separator from "$ui/separator/separator.svelte";
  import dayjs from "dayjs";
  import { onDestroy, untrack } from "svelte";
  import { toast } from "svelte-sonner";
  import type { TicketsPUTFields } from "../../../api/v1/guilds/[guildid]/config/tickets/+server";
  import AnonymSettings from "./AnonymSettings.svelte";
  import MessageHandling from "./MessageHandling.svelte";
  import ResetStuff from "./ResetStuff.svelte";
  import SystemControl from "./SystemControl.svelte";
  import TicketForumCard from "./TicketForumCard.svelte";
  import { determineUnsavedChanges } from "$lib/utils";
  import { afterNavigate } from "$app/navigation";
  import DefaultMessages from "./DefaultMessages.svelte";
  import PingsCard from "./PingsCard.svelte";

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
  let unsavedChanges = $derived(
    determineUnsavedChanges(
      untrack(() => config.old),
      config.current,
    ),
  );

  async function saveFn() {
    if (!config.current) {
      toast.error("No configuration to save.");
      return;
    }

    showDateError = false;
    config.saving = true;

    const current = $state.snapshot(config.current);
    const pausedPayload = current.pausedUntil;

    // Validate pause date
    if (pausedPayload.date && dayjs(pausedPayload.date).isBefore(new Date())) {
      toast.error("Cannot set a pause date in the past.", {
        description: "Please select a future date for the pause.",
      });
      showDateError = true;
      config.saving = false;
      return;
    }

    try {
      const res = await apiClient.put(APIRoutes.ticketsConfig(page.params.guildid!), {
        json: {
          allowedBots: current.allowedBots,
          enabled: current.enabled,
          anonym: {
            enabled: !!current.anonym.enabled,
            user: !!current.anonym.user,
          },
          autoForwarding: current.autoForwarding,
          pausedUntil: pausedPayload,
          creationMessage: current.creationMessage,
          closeMessage: current.closeMessage,
          pings: current.pings,
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

      toast.success("Ticket configuration saved successfully.");
    } catch (error: any) {
      toast.error(`Failed to save ticket configuration: ${error.message}`);
    } finally {
      config.saving = false;
    }
  }

  function resetConfig() {
    if (config.old) {
      config.current = { ...config.old };
    }
  }

  afterNavigate(async () => {
    try {
      const res = await apiClient.get(APIRoutes.ticketsConfig(page.params.guildid!));

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

<SaveAlert
  saving={config.saving}
  {unsavedChanges}
  discardChanges={() => {
    if (config.old) {
      config.current = { ...config.old };
      fetchedPauseState = config.old.pausedUntil;
    }
  }}
  saveData={saveFn}
/>

<SettingsGrid class="mt-6 mb-40">
  {#if config.current}
    <SystemControl
      bind:pausedUntil={config.current.pausedUntil}
      bind:enabled={config.current.enabled}
      fetchedState={fetchedPauseState}
      ticketForumSet={!!config.current.forumId}
      {showDateError}
    />
    <MessageHandling
      bind:allowedBots={config.current.allowedBots}
      bind:autoForward={config.current.autoForwarding}
    />
    <TicketForumCard
      forumId={config.current.forumId ?? null}
      oldCfg={config.old}
      currentCfg={config.current}
      loading={config.loading}
    />
    <PingsCard bind:pings={config.current!.pings!} />
    <AnonymSettings bind:anonymSettings={config.current.anonym} />
    <DefaultMessages
      bind:creationMessage={
        () => config.current!.creationMessage || "", (v) => (config.current!.creationMessage = v)
      }
      bind:closeMessage={() => config.current!.closeMessage || "", (v) => (config.current!.closeMessage = v)}
    />
    <Separator class="col-span-full my-5" />
    <ResetStuff discardChanges={resetConfig} />
  {:else}
    <div class="col-span-full flex h-48 items-center justify-center">
      <LoadingSpinner />
    </div>
  {/if}
</SettingsGrid>
