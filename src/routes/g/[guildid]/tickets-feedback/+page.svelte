<script lang="ts">
  import { page } from "$app/state";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import type { DBGuildProjectionReturns } from "$lib/server/db";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import { APIRoutes } from "$lib/urls";
  import apiClient from "$lib/utils/apiClient";
  import { toast } from "svelte-sonner";
  import FeedbackConfigPage from "./FeedbackConfigPage.svelte";
  import SetupFeedbackPage from "./SetupFeedbackPage.svelte";
  import type { IFeedbackConfig } from "supportmail-types";
  import { hasAllKeys } from "$lib/utils";

  const feedback = new ConfigState<DBGuildProjectionReturns["feedback"]>({ isEnabled: false });
  let fetchedStatus = $state<null | boolean>(null);

  $inspect("feedback", feedback.config);

  const saveFn: SaveFunction = async function () {
    const current = feedback.snap();
    if (!feedback.evalUnsaved() || !current) {
      toast.info("Nothing to save.");
      return;
    }

    feedback.saving = true;

    try {
      const res = await apiClient.put(APIRoutes.ticketFeedback(page.data.guildId!), {
        json: {
          isEnabled: current.isEnabled,
          thankYou: current.thankYou || "",
          questions: current.questions || [],
        } as Omit<IFeedbackConfig, "tags">,
      });

      if (!res.ok) {
        const error = await res.json<any>();
        throw new Error(error.message || "Failed to save ticket feedback configuration.");
      }

      const json = await res.json<DBGuildProjectionReturns["feedback"]>();

      fetchedStatus = hasAllKeys(json.tags, ["one", "two", "three", "four", "five"]);
      feedback.saveConfig(json);
    } catch (err: any) {
      console.error("Failed to save ticket feedback configuration:", err);
      toast.error("Failed to save ticket feedback configuration.", {
        description: err.message,
      });
      feedback.saving = false;
      return;
    }
  };

  $effect(() => {
    console.log("Hello from feedback");
    fetch(APIRoutes.ticketFeedback(page.data.guildId!))
      .then((res) => {
        if (!res.ok) {
          toast.error("Failed to load ticket configuration.", {
            description: "Please try again later.",
          });
          return;
        }

        res.json().then((data: DBGuildProjectionReturns["feedback"]) => {
          feedback.setConfig(data);
          feedback.setBackup(data);
          feedback.saving = false; // Loading is also set with this one
          feedback.unsaved = false;
          fetchedStatus = hasAllKeys(data.tags, ["one", "two", "three", "four", "five"]);
          console.log("Feedback config loaded:", data);
        });
      })
      .catch((err) => {
        toast.error("Failed to load ticket configuration.", {
          description: err.message,
        });
      });
    return () => {
      console.log("Bye from feedback");
      feedback.clear();
    };
  });
</script>

<SiteHeading title="Ticket Feedback" />

{#if feedback.loading || fetchedStatus === null}
  <div class="h-full w-full">
    <LoadingSpinner />
  </div>
{:else if !!fetchedStatus && feedback.isConfigured()}
  <FeedbackConfigPage
    bind:feedback={feedback.config}
    {saveFn}
    loading={feedback.loading}
    saving={feedback.saving}
  />
{:else}
  <div class="w-full max-w-3xl">
    <SetupFeedbackPage />
  </div>
{/if}
