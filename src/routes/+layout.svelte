<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { afterNavigate, beforeNavigate, goto } from "$app/navigation";
  import { page } from "$app/state";
  import { site } from "$stores/site.svelte";
  import { ModeWatcher } from "mode-watcher";
  import { Toaster } from "$ui/sonner/index.js";

  let { children, data } = $props();

  onMount(async function () {
    if (!data.user) {
      console.log("User not found");
      if (page.url.pathname !== "/login") {
        console.log("Redirecting to /login");
        goto("/login");
      }
      return;
    }

    const redirectParam = page.url.searchParams.get("redirect");
    if (redirectParam) {
      if (redirectParam.startsWith("/g/")) {
        // Guild-specific redirect
        const guildId = redirectParam.split("/")[2];
        const path = redirectParam.replace("/g/" + guildId, "");
        localStorage.setItem("redirect", JSON.stringify({ path: path, guildId: guildId }));
        console.log("Set redirect (1)", JSON.parse(localStorage.getItem("redirect")!));
      } else if (redirectParam.startsWith("/")) {
        // Redirect after selecting the guild
        localStorage.setItem("redirect", JSON.stringify({ path: page.url.searchParams.get("redirect") }));
        console.log("Set redirect (2)", JSON.parse(localStorage.getItem("redirect")!));
      }
      goto(window.location.pathname, { replaceState: true });
    }

    const redirect = JSON.parse(localStorage.getItem("redirect") || "{}") as RedirectData;
    if (window.location.pathname == "/" && redirect.guildId) {
      localStorage.removeItem("redirect");
      console.log("Redirecting to", "/g/" + redirect.guildId + redirect.path);
      goto("/g/" + redirect.guildId + redirect.path, { replaceState: true });
    } else if (window.location.pathname.match(/^\/g\/\d+(\/\w+)?/i) && redirect.path) {
      localStorage.removeItem("redirect");
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

<svelte:head>
  <!-- SEO... -->
  <title>Dashboard | SupportMail</title>
  <meta property="og:title" content="Dashboard | SupportMail" />
  <meta property="og:description" content="Manage your Discord server's support mail system with ease" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={page.url.href} />
  <meta property="og:site_name" content="SupportMail" />
</svelte:head>

<ModeWatcher />

{@render children?.()}

<Toaster position={"top-center"} richColors visibleToasts={4} closeButton />
