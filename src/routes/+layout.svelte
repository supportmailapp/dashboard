<script lang="ts">
  import { guilds, loadGuilds } from "$lib/stores/guilds.svelte";
  import { loadDbUser, user } from "$lib/stores/user.svelte";
  import { onMount } from "svelte";
  import "../app.css";

  let { children, data } = $props();

  user.discord = data.user as BasicUser;

  onMount(async function () {
    console.log($state.snapshot(user.discord));
    if (user.discord && !guilds.value.length) {
      loadDbUser(user.discord.id);
      loadGuilds(user.discord.id);
    }
  });
</script>

<!-- Layout for server selection or login -->
{@render children()}
