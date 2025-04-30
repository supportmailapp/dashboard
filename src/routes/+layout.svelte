<script lang="ts">
  import "../app.css";
  import { guilds, loadGuilds } from "$lib/stores/guilds.svelte";
  import { loadDbUser, user } from "$lib/stores/user.svelte";
  import { onMount } from "svelte";
  import { afterNavigate, beforeNavigate, goto } from "$app/navigation";
  import { page } from "$app/state";
  import { site } from "$lib/stores/site.svelte";

  let { children, data } = $props();

  user.discord = data.user;

  onMount(async function () {
    if (!data.user) {
      goto("/login");
      return;
    }

    if (!guilds.value.length) {
      loadGuilds();
      loadDbUser();
    }

    const redirectParam = page.url.searchParams.get("redirect");
    if (redirectParam) {
      if (redirectParam.startsWith("/g/")) {
        // Guild-specific redirect
        const guildId = redirectParam.split("/")[2];
        const path = redirectParam.replace("/g/" + guildId, "");
        window.localStorage.setItem("redirect", JSON.stringify({ path: path, guildId: guildId }));
        console.log("Set redirect (1)", JSON.parse(window.localStorage.getItem("redirect")!));
      } else if (redirectParam.startsWith("/")) {
        // Redirect after selecting the guild
        window.localStorage.setItem("redirect", JSON.stringify({ path: page.url.searchParams.get("redirect") }));
        console.log("Set redirect (2)", JSON.parse(window.localStorage.getItem("redirect")!));
      }
      goto(window.location.pathname, { replaceState: true });
    }

    const redirect = JSON.parse(window.localStorage.getItem("redirect") || "{}") as RedirectData;
    if (window.location.pathname == "/" && redirect.guildId) {
      window.localStorage.removeItem("redirect");
      console.log("Redirecting to", "/g/" + redirect.guildId + redirect.path);
      goto("/g/" + redirect.guildId + redirect.path, { replaceState: true });
    } else if (window.location.pathname.match(/^\/g\/\d+(\/\w+)?/i) && redirect.path) {
      window.localStorage.removeItem("redirect");
      console.log("Redirecting to", redirect.path);
      goto(redirect.path, { replaceState: true });
    }
  });

  beforeNavigate((nav) => {
    if (nav.to?.url.origin === page.url.origin) {
      site.showLoading = true;
    }
  });

  afterNavigate((nav) => {
    nav.complete.finally(() => {
      site.showLoading = false;
    });
  });
</script>

<div style="display: contents;">
  {@render children()}
</div>
