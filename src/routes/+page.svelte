<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";

  import Footer from "$lib/components/Footer.svelte";
  import RefreshButton from "$lib/components/RefreshButton.svelte";
  import { guilds as guildsState } from "$lib/stores/guilds.svelte";
  import { user as userState } from "$lib/stores/user.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import UserSettingsDialog from "$lib/components/UserSettingsDialog.svelte";

  let showUserSettings = $state(false);
  let errorCopied = $state(false);
  let user = $derived(userState.discord as BasicUser);
  let dbUser = $derived(userState.db);
  let guilds = $derived(guildsState.value as DCGuild[]);

  $effect(() => {
    if (dbUser != null) {
      console.log("DBUser set:", $state.snapshot(dbUser));
    }
  });

  onMount(() => {
    if (user && guilds.length) {
      const redirect = window.localStorage.getItem("redirect");
      if (redirect) {
        window.localStorage.removeItem("redirect");
        goto(redirect);
      }
    }
  });
</script>

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

<div class="flex h-screen w-screen flex-col items-center justify-center">
  <div class="bg-base-200 top-0 right-0 left-0 flex w-full shadow-sm">
    <nav class="dy-navbar mx-auto max-w-[1200px]">
      <div id="branding" class="dy-navbar-start gap-x-3 gap-y-2 py-1 select-none">
        <img src="/logo.png" alt="Logo" class="size-12" />
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
            showUserSettings = true;
          }}
        >
          <img src={cdnUrls.userAvatar(user.id, user.avatar, "64")} alt="User Avatar" class="size-12 rounded-2xl object-cover" />
        </button>
      </div>
    </nav>
  </div>

  <div class="flex h-full max-h-screen w-full items-center justify-center p-3">
    <div class="relative h-full w-full max-w-[700px] overflow-hidden overflow-y-auto rounded-lg bg-slate-800">
      <div class="absolute top-0 left-0 flex w-full flex-col items-start justify-center gap-2 p-3 text-center">
        {#each guilds as guild}
          {@render guildrow(guild.id, guild.name, guild.iconHash, guild.isConfigured)}
        {/each}
      </div>
    </div>
  </div>

  <UserSettingsDialog bind:showModal={showUserSettings} />

  <Footer year={page.data.ccDate} />
</div>

{#if errorCopied}
  <div class="dy-toast dy-toast-right z-50 select-none" transition:slide>
    <div class="dy-alert dy-alert-info">
      <span>Error message copied to clipboard</span>
    </div>
  </div>
{/if}
