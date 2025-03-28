<script lang="ts">
  import { page } from "$app/state";
  import Home from "$lib/assets/home.svelte";
  import { PLUGINS } from "$lib/constants";
  import { gg } from "$lib/stores/guild.svelte";
  import { user } from "$lib/stores/user.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { slide } from "svelte/transition";
  import { buildNavHref, showServerSelect } from "./navigation.svelte";
  import UserSettingsDialog from "./UserSettingsDialog.svelte";
  import { unsavedChanges } from "$lib/stores/config.svelte";

  let _user = $derived(user.discord)!;
  let showUserSettings = $state(false);

  function isCurrentPage(href: string = "/") {
    return page.url.pathname === href;
  }
</script>

<nav class="dektop-nav" transition:slide={{ duration: 350, axis: "x" }}>
  <a
    href="/"
    id="branding"
    class="flex w-full items-center justify-center gap-1.5 px-1 py-2 text-white transition-opacity duration-100 ease-linear select-none hover:opacity-60"
  >
    <img src="/logo.png" alt="Logo" class="dy-avatar aspect-square size-8 drop-shadow-md" />
    <span class="text-xl font-bold">SupportMail</span>
  </a>
  <span class="dy-divider my-0 h-1"></span>
  <button class="dy-btn btn-base-300 dy-btn-lg w-full gap-2.5 px-2.5 text-white" onclick={() => (showUserSettings = true)}>
    <div class="dy-avatar">
      <div class="dy-mask size-8 rounded-xl">
        <img src={cdnUrls.userAvatar(_user.id, _user.avatar, 256)} alt="User Avatar" />
      </div>
    </div>
    <span class="max-w-[70%] truncate">{_user.displayName}</span>
  </button>
  <!-- Server select -->
  <button class="dy-btn btn-base-300 dy-btn-lg w-full gap-2.5 px-2.5 text-sm text-white" onclick={showServerSelect}>
    {#if gg.guild}
      <div class="dy-avatar">
        <div class="dy-mask dy-mask-squircle size-7">
          <img src={cdnUrls.guildIcon(gg.guild.id, gg.guild.icon, 256)} alt="Guild Icon" />
        </div>
      </div>
      <span class="max-w-[60%] truncate">{gg.guild.name}</span>
      <img src="/icons/chevron-up-down.svg" alt="???" class="ml-auto flex size-7" />
    {:else}
      <div class="dy-avatar">
        <div class="dy-skeleton aspect-square size-7"></div>
      </div>
      <span class="dy-skeleton h-4 w-20"></span>
    {/if}
  </button>
  <span class="dy-divider dy-divider-primary my-1"></span>
  <h2 class="nav-title">Plugins</h2>
  <!-- svelte-ignore a11y_invalid_attribute -->
  {#if !$unsavedChanges}
    <a href={buildNavHref("/")} class="nav-item {isCurrentPage(buildNavHref('/')) ? 'bg-base-300 no-animation' : ''}">
      <Home size={6} />
      <span class={isCurrentPage(buildNavHref("/")) ? "text-warning text- font-semibold" : ""}>Home</span>
    </a>
  {:else}
    <!-- svelte-ignore a11y_missing_attribute -->
    <a class="nav-item cursor-default {isCurrentPage(buildNavHref('/')) ? 'bg-base-300 no-animation' : ''}">
      <Home size={6} />
      <span class={isCurrentPage(buildNavHref("/")) ? "text-warning text- font-semibold" : ""}>Home</span>
    </a>
  {/if}
  {#each PLUGINS as plugin}
    {#if !$unsavedChanges}
      <a href={buildNavHref(plugin.slug)} class="nav-item {isCurrentPage(buildNavHref(plugin.slug)) ? 'active' : ''}">
        <img src={plugin.iconUrl} alt={plugin.name} class="size-6" />
        <span>{plugin.name}</span>
      </a>
    {:else}
      <!-- svelte-ignore a11y_missing_attribute -->
      <a class="nav-item cursor-default {isCurrentPage(buildNavHref(plugin.slug)) ? 'active' : ''}">
        <img src={plugin.iconUrl} alt={plugin.name} class="size-6" />
        <span>{plugin.name}</span>
      </a>
    {/if}
  {/each}
</nav>

<UserSettingsDialog bind:showModal={showUserSettings} />
