<script lang="ts">
  import { page } from "$app/state";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import type { DBGuildProjectionReturns } from "$lib/server/db";
  import { APIRoutes } from "$lib/urls";
  import ky from "ky";
  import { toast } from "svelte-sonner";
  import * as Card from "$ui/card/index.js";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import * as Tabs from "$ui/tabs";
  import { Button } from "$ui/button";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";

  const generalTicketsConf = new ConfigState<DBGuildProjectionReturns["generalTicketSettings"]>();

  $inspect(generalTicketsConf);

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
      generalTicketsConf.config;
    };
  });
</script>

<SiteHeading title="Ticket Configuration"></SiteHeading>

<section class="mt-6 w-full max-w-2xl">
  {#if generalTicketsConf.isConfigured()}
    <Card.Root class="">
      <Card.Header>
        <Card.Title>Tickets Status</Card.Title>
        {#if generalTicketsConf.config.enabled}
          <Card.Description>Disabling ticket won't reset any settings.</Card.Description>
        {/if}
      </Card.Header>
      <Card.Content>
        <Tabs.Root value={String(generalTicketsConf.config.enabled)}>
          <Tabs.List>
            <Tabs.Trigger value="true">Enabled</Tabs.Trigger>
            <Tabs.Trigger value="false">Disabled</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="true">
            <p>Tickets are <strong>enabled</strong>, users can create tickets.</p>
          </Tabs.Content>
          <Tabs.Content value="false">
            <p>Tickets are <strong>disabled</strong>, users <strong>cannot</strong> create new tickets.</p>
          </Tabs.Content>
        </Tabs.Root>
      </Card.Content>
    </Card.Root>

    <Button onclick={generalTicketsConf.setUnsaved}>Test</Button>
  {:else}
    <div class="grid place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
</section>
