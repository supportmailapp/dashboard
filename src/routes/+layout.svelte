<script lang="ts">
  import { guilds, loadGuilds } from "$lib/stores/guilds.svelte";
  import { user } from "$lib/stores/user.svelte";
  import { onMount } from "svelte";
  import "../app.css";

  let { children, data } = $props();

  user.set(data.user as BasicUser | null);

  onMount(async function () {
    console.log($state.snapshot(user.value));
    if (user.value && !guilds.value.length) {
      loadGuilds(user.value.id);
    }
  });
</script>

<!-- Layout for server selection or login -->
{@render children()}
