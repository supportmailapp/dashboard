<script lang="ts">
  import { guilds, loadGuilds } from "$lib/stores/guilds.svelte";
  import { loadDbUser, user } from "$lib/stores/user.svelte";
  import { onMount } from "svelte";
  import "../app.css";
  import { goto } from "$app/navigation";

  let { children, data } = $props();

  user.discord = data.user;

  onMount(async function () {
    if (!data.user) {
      const newUrl = new URL("/login", window.origin);
      if (!window.location.pathname.match(/^\/(login)?/i)) {
        if (window.location.pathname.match(/^\/\d+(\/\w+)?$/i)) {
          // Redirect to the current page after login
          newUrl.searchParams.set("redirect_base", window.location.pathname);
        } else if (window.location.pathname.match(/^\/\w+/i)) {
          // Redirect to the current page after selecting a server
          newUrl.searchParams.set("redirect_guild", "/");
        }
      }
      goto(newUrl.toString());
      return;
    }

    if (user.discord && !guilds.value.length) {
      loadGuilds(user.discord.id);
      loadDbUser(user.discord.id);
    }

    const redirect = window.localStorage.getItem("redirect_base");
    if (window.location.pathname == "/" && redirect) {
      window.localStorage.removeItem("redirect_base");
      window.localStorage.removeItem("redirect_guild");
      goto(redirect);
    }
  });
</script>

<!-- Layout for server selection or login -->
{@render children()}
