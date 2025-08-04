<script lang="ts">
  import { browser } from "$app/environment";
  import { beforeNavigate, goto } from "$app/navigation";
  import { page } from "$app/state";
  import Branding from "$lib/assets/Branding.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { LegalLinks } from "$lib/urls";
  import * as Card from "$ui/card/index.js";
  import { Separator } from "$ui/separator/index.js";
  import { slide } from "svelte/transition";
  import ServerSelect from "./ServerSelect.svelte";
  import { site } from "$lib/stores/site.svelte";

  let loading = $derived(site.showLoading);
  let hrefAfterLogin = $state<string | null>(null);
  let hrefAfterSelection = $state<string>("/home");

  $effect(() => {
    if (page.data.guildsManager.loaded) {
      site.showLoading = false;
    } else {
      site.showLoading = true;
    }
  });

  $effect(() => {
    if (!browser) return;

    site.showLoading = true;
    const nextUrl = page.url.searchParams.get("next");
    if (nextUrl?.startsWith("/g/")) {
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
    if (!page.data.guildsManager.guilds.length && !mounted) {
      mounted = true;
      page.data.guildsManager.loadGuilds();
    }
  });
</script>

<div id="bg" style="background-image: url(https://picsum.photos/1920/1080.webp);"></div>
<a
  href="https://picsum.photos/"
  target="_blank"
  rel="noopener noreferrer"
  class="text-muted hover:text-muted-foreground absolute right-3 bottom-3 z-50 text-[0.6rem]"
>
  Photo by <b>Picsum Photos</b>
</a>

<div class="flex h-screen flex-col items-center justify-center gap-6 p-3">
  <Card.Root
    class="flex h-[40rem] w-full max-w-xl flex-col overflow-clip bg-black/40 shadow-2xl shadow-black/50 backdrop-blur-md select-none"
  >
    <Card.Header class="shrink-0 text-center">
      <Branding />
    </Card.Header>
    <Card.Content class="flex min-h-0 flex-1 flex-col">
      {#if loading || page.data.guildsManager.guilds.length === 0}
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

<style>
  #bg {
    width: 100%;
    height: 100%;
    position: absolute;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    object-fit: cover;
    backdrop-filter: blur(0.75vh);
    filter: blur(0.75vh);
    -webkit-filter: blur(0.75vh);
    box-shadow: 0 0 200px rgba(0, 0, 0, 0.9) inset;
    z-index: -1;
  }
</style>
