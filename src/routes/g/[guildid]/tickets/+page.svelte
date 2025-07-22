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

  const generalTicketsConf = new ConfigState<DBGuildProjectionReturns["generalTicketSettings"]>();

  $inspect("generalTicketsConf", generalTicketsConf);

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
  {:else}
    <div class="grid place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
</section>
