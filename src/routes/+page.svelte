<script lang="ts">
  import { goto } from "$app/navigation";
  import { env } from "$env/dynamic/public";
  import Branding from "$lib/assets/Branding.svelte";
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

  onMount(() => {
    if (data.redirect) {
      goto(data.redirect);
    }
  });
</script>

<svelte:window onkeydown={handleEsc} />

<main class="max-h-screen p-4">
  <div
    class="flex max-h-[90%] w-full max-w-[1000px] flex-col place-items-center items-center justify-center min-w-[{data.currentUser
      ? '70%'
      : '50%'}] h-fit gap-y-5 md:gap-y-10"
  >
    <Branding />

    {#if data.currentUser}
      <div class="xy-center-items bg-base-200 flex items-stretch gap-x-5 rounded-xl p-3 select-none">
        <div>
          <div>
            <img
              src={cdnUrls.userAvatar(data.currentUser.id, data.currentUser.avatarHash)}
              alt="User Avatar"
              class="dy-avatar w-16 rounded-xl"
            />
          </div>
        </div>
        <div class="text-2xl font-bold">
          {data.currentUser.displayName}
        </div>
        <button
          class="dy-btn dy-btn-md dy-btn-info"
          onclick={() => {
            viewProfile = true;
          }}
        >
          <div>
            <img src="/arrow-right.svg" alt="Arrow Right" class="h-5 w-5" />
          </div>
        </button>
      </div>
    {/if}

    <div class="h-full {data.currentUser ? 'w-full' : ''}">
      {#if data.currentUser}
        <div class="inline-flex h-fit w-full items-center justify-center py-5 lg:justify-end">
          <form method="POST" action="?/reload">
            <button type="submit" class="dy-btn dy-btn-md md:dy-btn-sm dy-btn-soft border-2"> Reload Servers </button>
          </form>
        </div>
      {/if}

      <div class="bg-base-200 xy-center-items relative my-auto flex h-full w-full flex-col rounded-lg">
        <div class="flex max-h-[30rem] w-full flex-col gap-y-5 p-3">
          {#if data.currentUser}
            <!-- Server Table -->
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
                  <div class="flex items-center text-center">
                    <h2 class="text-lg sm:text-xl">{guildName}</h2>
                  </div>
                </div>
                <div class="server-select-actions">
                  {#if isConfigured}
                    <a role="button" href="/{guildId}" class="server-select-manage-btn"> Manage </a>
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

            <div class="rounded-box border-base-content/5 bg-base-100 overflow-x-hidden border">
              <div class="flex flex-row flex-wrap justify-center">
                {#each data.guilds as guild}
                  {@render guilditem(guild.id, guild.name, guild.iconHash, guild.isConfigured)}
                {/each}
              </div>
            </div>
          {:else}
            <!-- Login with Discord -->
            <form method="POST" action="?/login" class="xy-center-items w-full-h-full flex">
              <button class="dy-btn dy-btn-xl border-success hover:border-info dy-btn-outline gap-x-2 border-2">
                <img src="/discord-mark-white.svg" alt="Discord Logo" class="h-8 w-8" />
                <span>Login with Discord</span>
              </button>
            </form>
          {/if}
        </div>
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
                src={cdnUrls.userAvatar(String(data.currentUser?.id), String(data.currentUser?.avatarHash))}
                alt="User Avatar"
                class="object-cover"
              />
            </div>
            <div class="flex flex-col gap-y-1 select-none">
              <h1 class="text-xl">@{data.currentUser?.username || ""}</h1>
              <div class="text-md italic">{data.currentUser?.displayName}</div>
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
            Close
          </button>
        </form>
      </div>
    </div>
  </dialog>
</main>
