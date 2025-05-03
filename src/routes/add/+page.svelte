<script lang="ts">
  import { onMount } from "svelte";
  import { env } from "$env/dynamic/public";
  import { urls } from "$lib/urls";
  import { page } from "$app/state";

  onMount(() => {
    return window.location.assign(urls.botAuth(env.PUBLIC_ClientId, page.params.guildid));
  });
</script>
