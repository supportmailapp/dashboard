<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { urls } from "$lib/constants";
  import { onMount } from "svelte";

  const { data } = $props();

  onMount(() => {
    if (!data.easterEgg) goto(urls.botAuth(page.params.guildid));
  });
</script>

<p>Just wait a moment</p>
