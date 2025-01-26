<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { env } from "$env/dynamic/public";
  import Branding from "$lib/assets/Branding.svelte";
  import Footer from "$lib/baseComponents/Footer.svelte";
  import { urls } from "$lib/constants.js";
  import { cdnUrls } from "$lib/utils/formatting";
  import { onMount } from "svelte";

  let { data } = $props();

  let viewProfile = $state(false);

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
    if (data.redirect) {
      goto(data.redirect);
    }
  });
</script>

<svelte:window onkeydown={handleEsc} />

<main class="min-h-screen p-4">
  {#if data.user}
    <div class="flex flex-col lg:flex-row">
      <div class="w-full md:basis-1/3">
        <div class="flex h-full w-full flex-col items-center justify-center">
          <Branding />

          <div class="xy-center-items bg-base-200 flex w-fit gap-x-5 rounded-xl p-3 select-none">
            <div>
              <div>
                <img
                  src={cdnUrls.userAvatar(data.user.id, data.user.avatarHash)}
                  alt="User Avatar"
                  class="dy-avatar w-16 rounded-xl"
                />
              </div>
            </div>
            <div class="text-2xl font-bold">
              {data.user.displayName}
            </div>
            <button
              class="dy-btn dy-btn-md dy-btn-primary"
              onclick={() => {
                viewProfile = true;
              }}
            >
              <img src="/arrow-right.svg" alt="Arrow Right" class="h-5 w-5" />
            </button>
          </div>
          <div>
            <div class="inline-flex h-fit w-full items-center justify-center py-5">
              <form method="POST" action="?/reload" use:enhance>
                <button type="submit" class="dy-btn dy-btn-md md:dy-btn-sm dy-btn-soft border-2">Reload Servers</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div class="w-full p-5 md:basis-2/3">
        <!-- Servers -->
        {#snippet guilditem(guildId: string, guildName: string, guildIcon: string | null, isConfigured: boolean = false)}
          <div class="server-card">
            <div class="block h-fit w-fit justify-center">
              <img
                src={cdnUrls.guildIcon(guildId, guildIcon)}
                alt={guildName}
                class="server-select-icon {!isConfigured ? 'opacity-40' : ''}"
              />
            </div>
            <div class="dy-card-body items-center p-4 text-center {!isConfigured ? 'opacity-40' : ''}">
              <div data-tip={guildName} class="md:dy-tooltip md:dy-tooltip-accent flex items-center">
                <h2
                  class="line-clamp-1 max-h-10 max-w-full overflow-hidden text-center text-lg text-ellipsis select-none sm:text-xl"
                >
                  {guildName}
                </h2>
              </div>
            </div>
            <div class="server-select-actions">
              {#if isConfigured}
                <a role="button" href="/{guildId}/" class="server-select-manage-btn">Manage</a>
              {:else}
                <a
                  role="button"
                  href={urls.botAuth(env.PUBLIC_ClientId, guildId)}
                  target="_blank"
                  class="server-select-setup-btn"
                >
                  Setup
                </a>
              {/if}
            </div>
          </div>
        {/snippet}
        <div class="flex flex-row flex-wrap items-stretch justify-center gap-3">
          {#if data.guilds?.length}
            {#each data.guilds as guild}
              {@render guilditem(guild.id, guild.name, guild.iconHash, guild.isConfigured)}
            {/each}
          {:else}
            <span class="dy-loading dy-loading-spinner dy-loading-lg"></span>
          {/if}
        </div>
      </div>
    </div>

    <dialog id="profile" class="dy-modal dy-modal-bottom sm:dy-modal-middle text-base-content w-full">
      <div class="dy-modal-box h-[50%] w-full max-w-full">
        <div class="flex w-full items-center justify-center">
          <div class="flex w-full flex-col gap-4 self-center">
            <div class="flex items-center gap-4">
              <div class="dy-skeleton h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                <img
                  src={cdnUrls.userAvatar(String(data.user?.id), String(data.user?.avatarHash))}
                  alt="User Avatar"
                  class="object-cover"
                />
              </div>
              <div class="flex flex-col gap-y-1 select-none">
                <h1 class="text-xl">@{data.user?.username || ""}</h1>
                <div class="text-md italic">{data.user?.displayName}</div>
              </div>
              <div class="text-error flex grow justify-end">
                <form method="POST" action="?/logout">
                  <button type="submit" class="dy-btn dy-btn-lg dy-btn-error dy-btn-outline">
                    <img src="/logout.svg" alt="Logout" class="h-7 w-7" />
                  </button>
                </form>
              </div>
            </div>
            <div class="dy-skeleton h-32 w-full"></div>
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
    <div class="rounded-box bg-base-200 grid grid-cols-1 gap-4 p-5">
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

<Footer year={data.date.getFullYear()} />
