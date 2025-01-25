<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { env } from "$env/dynamic/public";
  import Branding from "$lib/assets/Branding.svelte";
  import { urls } from "$lib/constants.js";
  import { cdnUrls } from "$lib/utils/formatting";

  let { data } = $props();
</script>

<main class="max-h-screen">
  <div
    class="xy-center-items z-50 flex max-h-[90%] w-full max-w-[1000px] flex-wrap min-w-[{data.currentUser
      ? '70%'
      : '50%'}] flex-col gap-y-5 md:gap-y-10"
  >
    <Branding />

    {#if data.currentUser}
      <div class="xy-center-items flex flex-col gap-y-5 text-center select-none">
        <h1 class="text-3xl font-bold">
          Welcome, <span class="text-(--dc-blurple) underline underline-offset-3">{data.currentUser.displayName}</span>!
        </h1>
        <p class="text-lg">Select a server to manage</p>
      </div>
    {/if}

    <div class="h-full {data.currentUser ? 'w-full' : ''}">
      {#if data.currentUser}
        <div class="inline-flex h-fit w-full items-center justify-center py-5 lg:justify-end">
          <form method="POST" action="?/reload">
            <button
              type="submit"
              class="dy-btn dy-btn-md md:dy-btn-sm dy-btn-soft border-2"
            >
              Reload Servers
            </button>
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

            <div class="rounded-box border-base-content/5 bg-base-100 overflow-x-auto border">
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
</main>
