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
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import type { PatchFields } from "../../../api/v1/guilds/[guildid]/config/+server";
  import AllowedBots from "./AllowedBots.svelte";
  import AnonymSettings from "./AnonymSettings.svelte";
  import AutoForward from "./AutoForward.svelte";
  import PausingCard from "./PausingCard.svelte";
  import ResetStuff from "./ResetStuff.svelte";
  import TicketForumCard from "./TicketForumCard.svelte";

  const generalTicketsConf = new ConfigState<DBGuildProjectionReturns["generalTicketSettings"]>();

  const saveAll: SaveFunction = async function (setLoading, callback) {
    if (!generalTicketsConf.evalUnsaved()) {
      toast.info("Nothing to save.");
      return;
    }

    setLoading(true);

    const current = $state.snapshot(generalTicketsConf.config);
    try {
      const res = await apiClient.patch(APIRoutes.ticketsConfig(page.data.guildId!), {
        json: {
          allowedBots: current?.allowedBots,
          enabled: current?.enabled,
          anonym: current?.anonym
            ? {
                enabled: current.anonym.enabled,
                user: current.anonym.user,
              }
            : undefined,
          autoForwarding: current?.autoForwarding,
        } as PatchFields,
      });

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to save ticket configuration.");
      }

      const json = await res.json<DBGuildProjectionReturns["generalTicketSettings"]>();
      generalTicketsConf.saveConfig(json);
      toast.success("Ticket configuration saved successfully.");

      callback?.(json);
    } catch (error: any) {
      toast.error(`Failed to save ticket configuration: ${error.message}`);
      return;
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
        res.json().then((data: DBGuildProjectionReturns["generalTicketSettings"]) => {
          generalTicketsConf.saveConfig(data);
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
  {#if generalTicketsConf.isConfigured()}
    <PausingCard bind:pausedUntil={generalTicketsConf.config.pausedUntil} />
    <TicketForumCard
      forumId={generalTicketsConf.config.forumId ?? null}
      wholeConfig={generalTicketsConf}
      bind:enabled={generalTicketsConf.config.enabled}
      saveAllFn={saveAll}
    />
    <AutoForward bind:autoForward={generalTicketsConf.config.autoForwarding} saveAllFn={saveAll} />
    <AllowedBots bind:allowedBots={generalTicketsConf.config.allowedBots} saveAllFn={saveAll} />
    <AnonymSettings bind:anonymSettings={generalTicketsConf.config.anonym} saveAllFn={saveAll} />
    <Separator class="col-span-full my-5" />
    <ResetStuff />
  {:else}
    <div class="grid place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
</SettingsGrid>
