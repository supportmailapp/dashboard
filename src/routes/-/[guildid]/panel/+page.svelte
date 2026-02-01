<script lang="ts">
  import { page } from "$app/state";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import SaveAlert from "$lib/components/SaveAlert.svelte";
  import SiteHeading from "$lib/components/SiteHeading.svelte";
  import type { APIPanel } from "$lib/sm-types/src";
  import { APIRoutes } from "$lib/urls";
  import { determineUnsavedChanges } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import { toast } from "svelte-sonner";
  import * as Card from "$ui/card/index";
  import * as Field from "$ui/field/index";
  import Button from "$ui/button/button.svelte";
  import Pencil from "@lucide/svelte/icons/pencil";
  import PanelDialog from "$lib/components/panel/PanelDialog.svelte";
  import { fly } from "svelte/transition";
  import { afterNavigate } from "$app/navigation";
  import AllowedMentions from "./AllowedMentions.svelte";

  let oldPanel: APIPanel | null = null;
  let panel = $state<APIPanel | null>(null);
  let loading = $state(true);
  let saving = $state(false);
  let unsavedChanges = $derived(determineUnsavedChanges(oldPanel, $state.snapshot(panel)));
  const dialog = $state({
    panel: false,
    mentions: false,
  });

  async function fetchPanel() {
    loading = true;
    const res = await apiClient.get<APIPanel>(APIRoutes.panel(page.params.guildid!));

    if (res.ok) {
      const jsonRes = await res.json();
      panel = jsonRes;
      oldPanel = { ...jsonRes };
    } else {
      panel = {
        guildId: page.params.guildid!,
        createdBy: page.data.user!.id,
        data: [],
        allowedMentions: {
          everyone: false,
          roles: [],
          users: [],
          roleMode: "none",
          userMode: "none",
        },
      };
      oldPanel = { ...$state.snapshot(panel) };
    }

    loading = false;
  }

  async function savePanel() {
    if (!panel) {
      toast.error("No panel to save.");
      return;
    }

    saving = true;
    const currentPanel = $state.snapshot(panel);

    const res = await apiClient.post<APIPanel>(APIRoutes.panel(page.params.guildid!), {
      json: currentPanel,
    });

    if (res.ok) {
      const jsonRes = await res.json();
      panel = jsonRes;
      oldPanel = { ...jsonRes };
      toast.success("Panel saved successfully.");
    } else {
      toast.error("Failed to save panel.");
    }

    saving = false;
  }

  afterNavigate(fetchPanel);
</script>

<SaveAlert
  {saving}
  {unsavedChanges}
  discardChanges={() => {
    if (oldPanel && panel) {
      panel = { ...oldPanel };
    }
  }}
  saveData={savePanel}
/>

<div class="container mb-40 max-w-4xl space-y-6" in:fly={{ x: -30, duration: 200 }}>
  <SiteHeading title="Panel" subtitle="Configure a custom message for your server" />

  <div class="flex flex-col gap-3">
    {#if loading || !panel}
      <div class="col-span-full text-center">
        <LoadingSpinner />
      </div>
    {:else}
      <Card.Root>
        <Card.Header>
          <Card.Title>Panel Configuration</Card.Title>
        </Card.Header>
        <Card.Content>
          <Field.Group>
            <Field.Field orientation="horizontal">
              <Field.Label>Panel Data</Field.Label>
              <Button onclick={() => (dialog.panel = true)}>
                <Pencil />
                Edit Panel
              </Button>
            </Field.Field>

            <Field.Field orientation="horizontal">
              <Field.Label>Allowed Mentions</Field.Label>
              <AllowedMentions bind:open={dialog.mentions} bind:allowedMentions={panel.allowedMentions} />
            </Field.Field>
          </Field.Group>
        </Card.Content>
      </Card.Root>
      <PanelDialog bind:open={dialog.panel} bind:components={panel.data} />
    {/if}
  </div>
</div>
