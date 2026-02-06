<script lang="ts">
  import "../app.css";
  import { afterNavigate, beforeNavigate, goto } from "$app/navigation";
  import { page } from "$app/state";
  import { site } from "$stores/site.svelte";
  import { ModeWatcher } from "mode-watcher";
  import { Toaster } from "$ui/sonner/index.js";
  import { getManager, setManager } from "$lib/stores/GuildsManager.svelte";
  import { setSnowflakes } from "$lib/stores/SnowflakeControls.svelte";

  let { children, data } = $props();

  setManager();
  setSnowflakes();
  const guildsManager = getManager();

  beforeNavigate((nav) => {
    if (nav.from?.route === nav.to?.route) {
      nav.cancel();
      return;
    }
  });

  afterNavigate((nav) => {
    nav.complete.finally(() => {
      site.showLoading = false;
    });

    if (!data.user) {
      console.log("User not found");
      if (page.url.pathname !== "/login") {
        console.log("Redirecting to /login");
        goto("/login");
      }
      return;
    }

    if (!guildsManager.loaded) {
      guildsManager.loadGuilds();
    }
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
  <meta property="theme-color" content="#1146E5" />
</svelte:head>

<ModeWatcher />

{@render children?.()}

<Toaster position={"top-center"} richColors visibleToasts={4} closeButton />

<!-- <Snowflakes /> -->
