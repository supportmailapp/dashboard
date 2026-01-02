<script lang="ts">
  import { browser } from "$app/environment";
  import { beforeNavigate, goto } from "$app/navigation";
  import { page } from "$app/state";
  import Branding from "$lib/assets/Branding.svelte";
  import BackgroundImage from "$lib/components/BackgroundImage.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { getManager } from "$lib/stores/GuildsManager.svelte";
  import { site } from "$lib/stores/site.svelte";
  import { LegalLinks } from "$lib/urls";
  import * as Card from "$ui/card/index.js";
  import { Separator } from "$ui/separator/index.js";
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import ServerSelect from "./ServerSelect.svelte";

  let loading = $derived(site.showLoading);
  let hrefAfterLogin = $state<string | null>(null);
  let hrefAfterSelection = $state<string>("/home");
  const guildsManager = getManager();

  $effect(() => {
    if (guildsManager.loaded) {
      site.showLoading = false;
    } else {
      site.showLoading = true;
    }
  });

  $effect(() => {
    if (!browser) return;

    site.showLoading = true;
    const nextUrl = page.url.searchParams.get("next");
    if (nextUrl?.startsWith("/-/")) {
      goto(nextUrl);
    } else if (nextUrl?.startsWith("/")) {
      hrefAfterSelection = nextUrl;
    }

    const lsHrefAfterLogin = localStorage.getItem("urlAfterLogin") ?? null;
    const lshrefAfterSelection = localStorage.getItem("urlAfterSelection") ?? null;
    if (lsHrefAfterLogin) {
      hrefAfterLogin = lsHrefAfterLogin;
      localStorage.removeItem("urlAfterLogin");
    }
    if (lshrefAfterSelection && hrefAfterSelection !== "/home") {
      hrefAfterSelection = lshrefAfterSelection;
      localStorage.removeItem("urlAfterSelection");
    }

    if (hrefAfterLogin !== null) {
      goto(hrefAfterLogin);
    }
  });

  beforeNavigate(({ complete }) => {
    site.showLoading = true;
    complete.finally(() => {
      site.showLoading = false;
    });
  });

  let mounted = false;
  $effect(() => {
    if (!guildsManager.guilds.length && !mounted) {
      mounted = true;
      guildsManager.loadGuilds();
    }
  });
</script>

<BackgroundImage />

<div class="flex h-screen flex-col items-center justify-center gap-6 p-3">
  <Card.Root
    class="flex h-160 w-full max-w-xl flex-col overflow-clip border-none bg-background shadow-xl shadow-black/60 backdrop-blur-md select-none"
  >
    <Card.Header class="shrink-0 text-center">
      <Branding />
    </Card.Header>
    <Card.Content class="flex min-h-0 flex-1 flex-col">
      {#if loading || guildsManager.guilds.length === 0}
        <div
          class="grid h-full w-full place-items-center py-3"
          transition:slide={{ duration: 200, axis: "x" }}
        >
          <LoadingSpinner size="20" />
        </div>
      {:else}
        <ServerSelect />
      {/if}
    </Card.Content>
    <Card.Footer class="text-muted-foreground flex h-5 shrink-0 flex-row justify-center gap-4 px-3 text-xs">
      <!-- This is actually the footer for this page -->
      <p>&copy; 2025 SupportMail</p>
      <Separator orientation="vertical" />
      <a href={LegalLinks.terms} target="_blank" class="hover:underline">Terms of Service</a>
      <Separator orientation="vertical" />
      <a href={LegalLinks.privacy} target="_blank" class="hover:underline">Privacy Policy</a>
    </Card.Footer>
  </Card.Root>
</div>
