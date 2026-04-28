<script lang="ts">
  import "../app.css";
  import { afterNavigate, beforeNavigate, goto } from "$app/navigation";
  import { page } from "$app/state";
  import { site } from "$stores/site.svelte";
  import { ModeWatcher } from "mode-watcher";
  import { Toaster } from "$ui/sonner/index.js";
  import { getManager, setManager } from "$lib/stores/GuildsManager.svelte";
  import { setSnowflakes } from "$lib/stores/SnowflakeControls.svelte";
  import { isVpn } from "$lib/stores/vpn.svelte";
  import { TooltipProvider } from "$ui/tooltip/index.js";

  let { children, data } = $props();

  $effect(() => {
    console.log("Layout data changed:", data);
    if (data.isVpn && isVpn.current.value === null) {
      isVpn.current = { seen: false, value: true };
    }
  });

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

<ModeWatcher />

<TooltipProvider>
  {@render children?.()}
</TooltipProvider>

<Toaster position={"top-center"} richColors visibleToasts={4} closeButton />

<!-- <Snowflakes /> -->
