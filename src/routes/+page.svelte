<script lang="ts">
  import { goto, invalidate, invalidateAll } from "$app/navigation";
  import { page } from "$app/state";
  import { env } from "$env/dynamic/public";
  import Branding from "$lib/assets/Branding.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import RefreshButton from "$lib/components/RefreshButton.svelte";
  import { urls } from "$lib/constants.js";
  import { guilds } from "$lib/stores/guilds.svelte";
  import { user } from "$lib/stores/user.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";

  let viewProfile = $state(false);
  let errorCopied = $state(false);

  $effect(() => {
    if (viewProfile) {
      const dialog = document.getElementById("profile") as HTMLDialogElement;
      dialog.showModal();
    }
  });

  const handleEsc = (event: KeyboardEvent) => {
    if (event.key === "Escape") viewProfile = false;
  };

  onMount(async () => {
    if (page.data.redirect) {
      goto(page.data.redirect);
    }
  });
</script>

<svelte:window onkeydown={handleEsc} />

<!-- Servers -->
{#snippet guildrow(guildId: string, guildName: string, guildIcon: string | null, isConfigured: boolean = false)}
  <a
    class="hover:bg-base-300 flex w-full flex-row items-center justify-between gap-x-2 rounded-lg transition-all duration-100 {!isConfigured
      ? 'opacity-40 hover:opacity-90'
      : ''}"
    href="/{guildId}"
  >
    <div class="flex items-center justify-center p-2">
      <div class="dy-avatar">
        <div class="dy-mask dy-mask-squircle h-12 w-12">
          <img src={cdnUrls.guildIcon(guildId, guildIcon)} alt={guildName} />
        </div>
      </div>
    </div>
    <div class="flex max-w-3/5 min-w-1/5 justify-center truncate text-lg">
      <span class="block w-fit truncate">{guildName}</span>
    </div>
    <div class="block min-w-fit items-center justify-center px-2">
      <img src={!isConfigured ? "/plus-circle.svg" : "/arrow-right-circle.svg"} alt="Continue" class="block size-8" />
    </div>
  </a>
{/snippet}

{#if user.value && guilds.value.length}
  <div class="bg-base-200 sticky top-0 z-50 w-full shadow-sm">
    <nav class="dy-navbar mx-auto max-w-[1200px]">
      <div id="branding" class="dy-navbar-start gap-x-3 gap-y-2 py-1 select-none">
        <img src="/logo.png" alt="Logo" class="h-16 w-16" />
        <span class="hidden text-3xl font-bold text-white sm:block">SupportMail</span>
      </div>

      <div class="dy-navbar-center justify-center">
        <RefreshButton text="Reload Servers" />
      </div>
      <div class="dy-navbar-end">
        <button
          tabindex="0"
          class="hover:border-info cursor-pointer rounded-2xl border-2 border-transparent transition-all duration-100 ease-in-out"
          onclick={() => {
            viewProfile = true;
          }}
        >
          <img
            src={cdnUrls.userAvatar(user.value.id, user.value.avatar, "64")}
            alt="User Avatar"
            class="h-[4rem] w-[4rem] rounded-2xl object-cover"
          />
        </button>
      </div>
    </nav>
  </div>
{/if}

<main class="min-h-screen w-full p-5">
  {#if user.value && guilds.value.length}
    <div class="rounded-box bg-base-200 h-full w-full max-w-[700px] overflow-hidden">
      <div class="dy-table flex w-full flex-col items-start justify-center gap-2 p-3 text-center">
        {#each guilds.value as guild}
          {@render guildrow(guild.id, guild.name, guild.iconHash, guild.isConfigured)}
        {/each}
      </div>
    </div>

    <dialog id="profile" class="dy-modal dy-modal-bottom sm:dy-modal-middle text-base-content w-full">
      <div class="dy-modal-box h-[50%] w-full max-w-full">
        <div class="flex w-full items-center justify-center">
          <div class="flex w-full flex-col gap-4 self-center">
            <div class="flex items-center gap-4">
              <div class="dy-skeleton h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                <img
                  src={cdnUrls.userAvatar(String(user.value.id), String(user.value.avatar))}
                  alt="User Avatar"
                  class="object-cover"
                />
              </div>
              <div class="flex flex-col gap-y-1 select-none">
                <h1 class="text-xl">@{user.value.username || ""}</h1>
                <div class="text-md italic">{user.value.displayName}</div>
              </div>
              <div class="text-error flex grow justify-end">
                <form method="POST" action="?/logout">
                  <button type="submit" class="dy-btn dy-btn-lg dy-btn-error dy-btn-outline">
                    <img src="/logout.svg" alt="Logout" class="h-7 w-7" />
                  </button>
                </form>
              </div>
            </div>
            <!-- User Settings - language (select), auto redirect (toggle))# -->
            <div class="dy-skeleton h-32 w-full">
              <p class="italic">Something is coming...</p>
            </div>
          </div>
        </div>

        <div class="dy-modal-action w-full">
          <form method="dialog" class="w-full">
            <button
              class="dy-btn dy-btn-soft w-full max-w-full"
              onclick={() => {
                viewProfile = false;
              }}
            >
              <kbd class="dy-kbd">ESC</kbd>
              Close
            </button>
          </form>
        </div>
      </div>
    </dialog>
  {:else}
    <!-- Login with Discord -->
    <div class="bg-base-200 mx-auto my-auto flex flex-col items-center justify-center gap-y-10 rounded-2xl p-5">
      <Branding />
      <form method="POST" action="?/login" class="xy-center-items">
        <button class="dy-btn dy-btn-xl border-success hover:border-info dy-btn-outline gap-x-3 border-2">
          <img src="/discord-mark-white.svg" alt="Discord Logo" class="h-8 w-8" />
          <span>Login with Discord</span>
        </button>
      </form>
    </div>
  {/if}
</main>

{#if errorCopied}
  <div class="dy-toast dy-toast-right select-none" transition:slide>
    <div class="dy-alert dy-alert-info">
      <span>Error message copied to clipboard</span>
    </div>
  </div>
{/if}

<Footer year={page.data.ccDate} />
