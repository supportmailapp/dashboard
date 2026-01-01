<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { afterNavigate, beforeNavigate, goto } from "$app/navigation";
  import { page } from "$app/state";
  import { site } from "$stores/site.svelte";
  import { ModeWatcher } from "mode-watcher";
  import { Toaster } from "$ui/sonner/index.js";
  import { getManager, setManager } from "$lib/stores/GuildsManager.svelte";

  let { children, data } = $props();

  setManager();
  const guildsManager = getManager();

  onMount(async function () {
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

  beforeNavigate((nav) => {
    if (nav.from?.url.pathname === nav.to?.url.pathname) {
      nav.cancel();
      return;
    }

    // if (nav.to?.url.origin === page.url.origin) {
    //   site.showLoading = true;
    // }
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
