<script lang="ts">
  import { onMount } from "svelte";
  import { env } from "$env/dynamic/public";
  import { urls } from "$lib/constants.js";
  import { page } from "$app/state";

  onMount(() => {
    if (page.params.guildid) {
      window.localStorage.setItem(
        "redirect",
        JSON.stringify({
          path: `/`,
          guildId: page.params.guildid,
        } satisfies RedirectData),
      );
    }
    return window.location.assign(urls.botAuth(env.PUBLIC_ClientId, page.params.guildid));
  });
</script>
