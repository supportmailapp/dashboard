<script lang="ts">
  import { page } from "$app/state";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import type { DBGuildProjectionReturns } from "$lib/server/db";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import { APIRoutes } from "$lib/urls";
  import { toast } from "svelte-sonner";
  import PausingCard from "./PausingCard.svelte";
  import TicketForumCard from "./TicketForumCard.svelte";
  import apiClient from "$lib/utils/apiClient";
  import AutoForward from "./AutoForward.svelte";
  import type { PatchFields } from "../../../api/v1/guilds/[guildid]/config/+server";
  import AllowedBots from "./AllowedBots.svelte";

  const generalTicketsConf = new ConfigState<DBGuildProjectionReturns["generalTicketSettings"]>();

  $inspect("generalTicketsConf", generalTicketsConf);

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

  $effect(() => {
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
    // Cleanup
    return () => {
      console.log("Cleaning up ticket configuration state");
      generalTicketsConf.clear();
    };
  });
</script>

<SiteHeading title="Ticket Configuration"></SiteHeading>

<section class="mt-6 w-full max-w-2xl space-y-4">
  {#if generalTicketsConf.isConfigured()}
    <PausingCard bind:pausedUntil={generalTicketsConf.config.pausedUntil} />
    <TicketForumCard forumId={generalTicketsConf.config.forumId ?? null} wholeConfig={generalTicketsConf} />
    <AutoForward bind:autoForward={generalTicketsConf.config.autoForwarding} saveAllFn={saveAll} />
    <AllowedBots bind:allowedBots={generalTicketsConf.config.allowedBots} saveAllFn={saveAll} />
  {:else}
    <div class="grid place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
</section>
