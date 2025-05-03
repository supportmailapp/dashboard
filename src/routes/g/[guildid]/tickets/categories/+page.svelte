<script lang="ts">
  import { page } from "$app/state";
  import DiscordEmoji from "$lib/components/DiscordEmoji.svelte";
  import { buildNavHref } from "$lib/components/navigation.svelte";
  import SiteHeader from "$lib/components/SiteHeader.svelte";
  import { BASIC_GET_FETCH_INIT } from "$lib/constants";
  import { APIRoutes } from "$lib/urls";
  import equal from "fast-deep-equal/es6";
  import ky from "ky";
  import type { ITicketCategory } from "supportmail-types";
  import { onMount } from "svelte";

  const guildId = page.data.guildid;
  let categories = $state<ITicketCategory[] | null>(null);
  let activeCategory = $state<ITicketCategory | null>(null);
  let loading = $derived(categories === null);

  $effect(() => {
    const current = $state.snapshot(categories);
    console.debug("Old config", page.data.dataState.oldConfig);
    console.debug("New config", current);
    if (current !== null) {
      if (equal(page.data.dataState.oldConfig, current)) {
        console.log("No changes detected");
        page.data.dataState.unsaved = false;
      } else {
        console.log("Changes detected");
        page.data.dataState.unsaved = true;
      }
    }
  });

  async function loadCategories() {
    const res = await ky.get(APIRoutes.configTicketCategories(guildId), BASIC_GET_FETCH_INIT);

    if (res.ok) {
      const data = (await res.json()) as ITicketCategory[];
      categories = data;
      page.data.dataState.oldConfig = structuredClone(data);
    } else {
      console.error("Failed to load ticket categories", res);
    }
  }

  async function saveChanges() {}

  async function revertChanges() {}

  onMount(loadCategories);
</script>

<SiteHeader breadcrumbs={[{ title: "Tickets", href: buildNavHref("/tickets") }]}>Ticket Categories</SiteHeader>

<DiscordEmoji id="1312118778439405649" name="Arrows" />
