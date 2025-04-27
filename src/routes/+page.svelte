<script lang="ts">
  import { slide } from "svelte/transition";

  import Footer from "$lib/components/Footer.svelte";
  import RefreshButton from "$lib/components/RefreshButton.svelte";
  import { guilds as guildsState } from "$lib/stores/guilds.svelte";
  import { user as userState } from "$lib/stores/user.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { CircleArrowRight, Plus } from "@lucide/svelte";
  import { site } from "$lib/stores/site.svelte";

  let showUserSettings = $state(false);
  let errorCopied = $state(false);
  let user = $derived(userState.discord as BasicUser);
  let guilds = $derived(guildsState.value as DCGuild[]);
  let firstNotConfiguredGuild = $derived.by(() => {
    if (guilds.length) {
      return guilds.find((guild) => !guild.isConfigured)?.id;
    }
  });
</script>

<!-- Servers -->
<div class="flex h-screen w-screen flex-col items-center justify-center">
  <!-- It's needed to be in the wrapper because otherwise the layout breaks. Dunno why. -->
  <header class="bg-base-200 sticky top-0 right-0 left-0 h-(--header-height) w-full">
    <nav class="dy-navbar mx-auto max-w-[1200px]">
      <div class="dy-navbar-start">
        <a
          href="https://supportmail.dev/"
          class="inline-flex items-center gap-x-3 gap-y-2 py-1 transition-opacity duration-100 select-none hover:opacity-70"
        >
          <img src="/logo.png" alt="Logo" class="size-12" />
          <span class="hidden text-3xl font-semibold text-white sm:block">SupportMail</span>
        </a>
      </div>

      <div class="dy-navbar-center justify-center">
        <RefreshButton text="Reload Servers" />
      </div>
      <div class="dy-navbar-end">
        <button
          tabindex="0"
          class="hover:border-info cursor-pointer rounded-2xl border-2 border-transparent transition-all duration-100 ease-in-out"
          onclick={() => {
            showUserSettings = true;
          }}
        >
          <img src={cdnUrls.userAvatar(user.id, user.avatar, "64")} alt="User Avatar" class="size-12 rounded-2xl object-cover" />
        </button>
      </div>
    </nav>
  </header>

  <div class="flex h-full max-h-screen w-full items-center justify-center p-3">
    <div class="relative h-[97%] w-full max-w-[700px] overflow-hidden overflow-y-auto rounded-lg bg-slate-800">
      <div class="absolute top-0 left-0 flex h-fit max-h-fit w-full flex-col items-start justify-start gap-2 p-3 text-center">
        {#if guilds.length == 0 || site.showLoading}
          <div class="flex h-full w-full items-center justify-center">
            <span class="dy-loading dy-loading-xl dy-loading-dots"></span>
          </div>
        {:else}
          {#each guilds as guild}
            {#if firstNotConfiguredGuild == guild.id}
              <div class="bg-base-300 h-0.5 w-full"></div>
            {/if}
            <a
              class="root-server-select-row {!guild.isConfigured ? 'opacity-40 hover:opacity-90' : ''}"
              href="/{guild.isConfigured ? 'g/' : 'add/'}{guild.id}"
            >
              <div class="flex items-center justify-center p-2">
                <div class="dy-avatar">
                  <div class="dy-mask dy-mask-squircle h-12 w-12">
                    <img src={cdnUrls.guildIcon(guild.id, guild.icon)} alt={guild.name} />
                  </div>
                </div>
              </div>
              <div class="flex max-w-3/5 min-w-1/5 justify-center truncate text-lg">
                <span class="block w-fit truncate">{guild.name}</span>
              </div>
              <div class="block min-w-fit items-center justify-center px-2">
                {#if guild.isConfigured}
                  <CircleArrowRight />
                {:else}
                  <Plus />
                {/if}
              </div>
            </a>
          {/each}
        {/if}
      </div>
    </div>
  </div>

  <Footer />
</div>

{#if errorCopied}
  <div class="dy-toast dy-toast-right z-50 select-none" transition:slide>
    <div class="dy-alert dy-alert-info">
      <span>Error message copied to clipboard</span>
    </div>
  </div>
{/if}

<style>
  :root {
    --header-height: 70px;
  }
</style>
