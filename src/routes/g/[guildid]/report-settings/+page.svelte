<script lang="ts">
  import { page } from "$app/state";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import type { DBGuildProjectionReturns } from "$lib/server/db";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import { APIRoutes } from "$lib/urls";
  import { toast } from "svelte-sonner";
  import PausingCard from "./PausingCard.svelte";
  import apiClient from "$lib/utils/apiClient";
  import { onMount } from "svelte";
  import type { PutFields } from "../../../api/v1/guilds/[guildid]/config/reports/+server";
  import MentionableSelectCard from "./MentionableSelectCard.svelte";
  import SettingsGrid from "$lib/components/SettingsGrid.svelte";
  import ChannelSelectCard from "./ChannelSelectCard.svelte";

  const reportsConfig = new ConfigState<DBGuildProjectionReturns["reportSettings"]>();

  let reportChannel = $state<GuildCoreChannel | undefined>();

  const saveAll: SaveFunction = async function (setLoading, callback) {
    if (!reportsConfig.evalUnsaved()) {
      toast.info("Nothing to save.");
      return;
    }

    setLoading(true);

    const current = $state.snapshot(reportsConfig.config);
    if (!current) {
      toast.error("No report configuration found to save.");
      setLoading(false);
      return;
    }

    const { pausedUntil, ...rest } = current;

    try {
      const res = await apiClient.put(APIRoutes.reportsConfig(page.data.guildId!), {
        json: {
          ...rest,
          enabled: !rest.channelId ? false : rest.enabled, // Make sure reports are disabled, when no channel is set (I dunno if state handles this correctly; just to be safe)
        } as PutFields,
      });

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to save report configuration.");
      }

      const json = await res.json<DBGuildProjectionReturns["reportSettings"]>();
      reportsConfig.saveConfig(json);
      toast.success("Report configuration saved successfully.");

      callback?.(json);
    } catch (error: any) {
      toast.error(`Failed to save report configuration: ${error.message}`);
      return;
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
          reportsConfig.saveConfig(data);
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
  {#if reportsConfig.isConfigured()}
    <PausingCard bind:pausedUntil={reportsConfig.config.pausedUntil} />
    <ChannelSelectCard
      bind:enabled={reportsConfig.config.enabled}
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
