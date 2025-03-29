<script>
  import { page } from "$app/state";
  import DesktopNavigation from "$lib/components/DesktopNavigation.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import { gg, loadGuildData } from "$lib/stores/guild.svelte";
  import { user } from "$lib/stores/user.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { onMount } from "svelte";

  let { children } = $props();

  onMount(async () => {
    if (!(gg.guild && gg.roles && gg.channels)) await loadGuildData();
  });
</script>

<div class="top-0 right-0 left-0 z-10 block h-screen w-full overflow-y-auto">
  <div class="mx-auto flex w-full max-w-[1000px]">
    <DesktopNavigation />
    <div class="relative top-0 flex-1 overflow-y-auto px-2 pt-2 pb-2 sm:ml-(--sidebar-width) sm:px-4">
      <header class="mb-5 flex h-16 items-center justify-between gap-2 overflow-hidden p-2">
        <a href={page.url.origin} class="xy-center flex gap-1 rounded-full shadow-slate-200 transition-opacity hover:opacity-80">
          <img src="/logo.png" alt="Logo" class="block aspect-square size-12 rounded-full border-2 border-slate-600" />
          <span class="hidden font-semibold select-none sm:block">SupportMail</span>
        </a>
        <a href="/@me" class="dy-btn dy-btn-info dy-btn-soft xy-center ml-auto flex h-fit flex-row px-3 py-1 text-2xl">
          {#if user.discord}
            <img
              src={cdnUrls.userAvatar(user.discord.id, user.discord.avatar, 64)}
              alt="User Avatar"
              class="size-[1.2em] rounded-md"
            />
            <span class="ml-2">{user.discord?.displayName}</span>
          {:else}
            <div class="dy-skeleton w-full"></div>
          {/if}
        </a>
      </header>

      <main>
        {@render children()}
      </main>
      <Footer />
    </div>
  </div>
</div>
