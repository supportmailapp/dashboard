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

  const feedback = new ConfigState<DBGuildProjectionReturns["feedback"]>({ isSet: false, data: null });

  $inspect("feedback", feedback.config);

  const saveFn: SaveFunction = async function () {
    const current = feedback.snap();
    if (!feedback.evalUnsaved() || !current) {
      toast.info("Nothing to save.");
      return;
    }

    feedback.saving = true;

    const { data } = current;
    const { tags, ...dataWithoutTags } = data ?? {};

    try {
      const res = await apiClient.put(APIRoutes.ticketFeedback(page.data.guildId!), {
        json: dataWithoutTags,
      });
    } catch (err: any) {
      console.error("Failed to save ticket feedback configuration:", err);
      toast.error("Failed to save ticket feedback configuration.", {
        description: err.message,
      });
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

{#if feedback.loading}
  <div class="h-full w-full">
    <LoadingSpinner />
  </div>
{:else if feedback.config && feedback.config.isSet}
  <FeedbackConfigPage bind:feedback={feedback.config.data} {saveFn} />
{:else}
  <SetupFeedbackPage />
{/if}
