<script lang="ts">
  import { afterNavigate, beforeNavigate, invalidate } from "$app/navigation";
  import AppSidebar from "$lib/components/app-sidebar.svelte";
  import { cdnUrls } from "$lib/urls";
  import { cn } from "$lib/utils";
  import * as Avatar from "$ui/avatar";
  import * as Sidebar from "$ui/sidebar/index.js";
  import * as Dialog from "$ui/dialog/index.js";
  import * as Alert from "$ui/alert/index.js";
  import { Button, buttonVariants } from "$ui/button";
  import { Skeleton } from "$ui/skeleton";
  import { fade, fly, scale, slide } from "svelte/transition";
  import { IsMobile } from "$lib/hooks/is-mobile.svelte";
  import Mounter from "./Mounter.svelte";
  import ServerSelector from "./ServerSelector.svelte";
  import { mode } from "mode-watcher";
  import { untrack } from "svelte";
  import { getManager } from "$lib/stores/GuildsManager.svelte";
  import { isVpn } from "$lib/stores/vpn.svelte";
  import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { Portal } from "bits-ui";
  import { useInterval } from "runed";
  import { cubicInOut } from "svelte/easing";

  let { children } = $props();

  let guildsManager = getManager();
  let currentGuild = $derived(guildsManager.currentGuild);
  let guildsSelectOpen = $state(false);
  Sidebar.useSidebar();
  let vpnAlert = $derived(isVpn.current);
  const isMobile = new IsMobile();

  const randomLoadingMessages = [
    "Just a moment",
    "Loading up the magic",
    "Summoning the servers",
    "Brewing some coffee",
    "Warming up the bits",
    "Polishing the pixels",
    "Aligning the bits and bytes",
    "Reticulating splines",
    "Optimizing the flux capacitor",
    "Charging the warp drive",
    "Calibrating the quantum entanglement",
    "Herding the cats",
    "Going after the easter bunny with a water gun",
  ];
  let loadingMessageIndex = $state<number>(Math.floor(Math.random() * randomLoadingMessages.length));

  const interval = useInterval(() => 3000, {
    callback: () => {
      loadingMessageIndex = (loadingMessageIndex + 1) % randomLoadingMessages.length;
    },
  });

  $effect(() => {
    if (guildsManager.loaded) {
      untrack(() => guildsManager.loadChannels());
      untrack(() => guildsManager.loadRoles());
    }
  });

  beforeNavigate(async (nav) => {
    console.log("beforeNavigate in layout", nav);
    if (nav.from?.route === nav.to?.route) {
      nav.cancel();
      return;
    }

    guildsSelectOpen = false;
  });

  afterNavigate(async (nav) => {
    const guildChanged =
      nav.from?.params?.guildid &&
      nav.to?.params?.guildid &&
      nav.from?.params?.guildid !== nav.to?.params?.guildid;
    if (guildChanged) {
      console.log("layout-load-layout.svelte-afterNavigate.ts-before");
      await invalidate("root:layout");
      console.log("layout-load-layout.svelte-afterNavigate.ts-after");
    }
  });
</script>

<Sidebar.Provider class="h-svh">
  <!-- Needs to be inserted here because it needs context from Sidebar.Provider -->
  <Mounter />
  <AppSidebar />
  <Sidebar.Inset class="main-container">
    <header
      class={cn(
        "bg-background text-sidebar-foreground sticky top-0 z-10 flex h-(--main-header-height) items-center justify-between border-b-2 p-3 shadow-lg",
        mode.current !== "dark" ? "shadow-accent/40" : "shadow-black/30",
      )}
    >
      <Sidebar.Trigger />

      <!-- Server Selector in Center -->
      <div class="flex items-center justify-center">
        <Button
          disabled={!currentGuild}
          variant="outline"
          size="lg"
          class={cn("w-57.5 justify-center shadow-md", !currentGuild && "cursor-not-allowed opacity-50")}
          onclick={() => (guildsSelectOpen = true)}
        >
          {#if currentGuild}
            <Avatar.Root class="size-7">
              <Avatar.Fallback>{currentGuild?.name.slice(0, 2)}</Avatar.Fallback>
              <Avatar.Image
                src={cdnUrls.guildIcon(currentGuild?.id, currentGuild?.icon, 128)}
                alt={currentGuild?.name}
              />
            </Avatar.Root>
            <span class="truncate text-center" transition:slide={{ duration: 200, axis: "x" }}>
              {currentGuild?.name}
            </span>
          {:else}
            <Skeleton class="h-7 w-8 rounded-full" />
            <Skeleton class="h-4 w-40" />
          {/if}
        </Button>
      </div>

      <!-- Branding on Right -->
      <div class="flex items-center">
        <a href="/" class="flex items-center gap-2 transition-opacity duration-150 hover:opacity-70">
          {#if !isMobile.current}
            <span class="text-lg font-bold" transition:slide={{ duration: 200, axis: "x" }}>SupportMail</span>
          {/if}
          <Avatar.Root class="aspect-square size-8">
            <Avatar.Image src="/logo.png" alt="Logo" />
            <Avatar.Fallback>SM</Avatar.Fallback>
          </Avatar.Root>
        </a>
      </div>
    </header>
    <main class="main-content overflow-y-auto p-3 md:p-5" transition:fade={{ duration: 200 }}>
      {@render children?.()}
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>

<ServerSelector bind:open={guildsSelectOpen} />

{#if vpnAlert.value && vpnAlert.seen === false}
  <Dialog.Root
    open
    onOpenChange={(_open) => {
      if (!vpnAlert.seen) {
        isVpn.current = { seen: true, value: true };
      }
    }}
  >
    <Dialog.Content interactOutsideBehavior="ignore" showCloseButton={false} class="border-0 bg-transparent">
      <Alert.Root variant="warning">
        <AlertCircleIcon />
        <Alert.Title>VPN Detected</Alert.Title>
        <Alert.Description>
          You seem to be using a VPN. This isn't necessarily a problem, but if you experience any issues with
          loading or using the dashboard, please try disabling your VPN and see if that resolves the issue.
        </Alert.Description>
      </Alert.Root>
      <Dialog.Footer class="w-full sm:justify-center">
        <Dialog.Close class={buttonVariants({ variant: "secondary", class: "min-w-xs" })}>OK</Dialog.Close>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{/if}

<Portal>
  {#if guildsManager.loaded}
    <div
      class="bg-background fixed inset-0 z-500 flex flex-col items-center justify-center gap-4"
      out:fade={{ duration: 200 }}
    >
      <LoadingSpinner />
      <div class="flex h-20 w-full flex-col items-center justify-center overflow-hidden">
        {#key loadingMessageIndex}
          <p class="text-muted-foreground text-center text-lg" in:fly={{ duration: 180, y: 20 }}>
            {randomLoadingMessages[loadingMessageIndex]}
          </p>
        {/key}
      </div>
    </div>
  {/if}
</Portal>

<style>
  :root {
    --main-header-height: 4rem;
  }
</style>
