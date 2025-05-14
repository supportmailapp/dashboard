<script lang="ts">
  import { page } from "$app/state";
  import Footer from "$lib/components/Footer.svelte";
  import LoadingDots from "$lib/components/LoadingDots.svelte";
  import SaveAlert from "$lib/components/SaveAlert.svelte";
  import { BASIC_GET_FETCH_INIT, BASIC_REQUEST_INIT, LANGUAGES } from "$lib/constants";
  import { site } from "$lib/stores/site.svelte";
  import { user } from "$lib/stores/user.svelte";
  import { APIRoutes } from "$lib/urls";
  import { cdnUrls } from "$lib/utils/formatting";
  import { ArrowLeft } from "@lucide/svelte";
  import equal from "fast-deep-equal/es6";
  import ky from "ky";
  import type { IDBUser } from "supportmail-types";
  import { onMount } from "svelte";

  let config = $state<Pick<IDBUser, "language" | "autoRedirect"> | null>(null);
  let toast = $state<string | null>(null);

  function goBack() {
    const previousUrl = document.referrer;
    console.debug("Previous URL:", previousUrl);
    site.showLoading = true;
    if (previousUrl && new URL(previousUrl).origin === window.location.origin) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  }

  $effect(() => {
    if (config !== null) {
      const current = $state.snapshot(config);
      console.debug("Old config", page.data.dataState.oldConfig);
      console.debug("New config", current);
      if (equal(page.data.dataState.oldConfig, current)) {
        console.log("No changes detected");
        page.data.dataState.unsaved = false;
      } else {
        console.log("Changes detected", current, page.data.dataState.oldConfig);
        page.data.dataState.unsaved = true;
      }
    }
  });

  page.data.dataState.save = async () => {
    const current = $state.snapshot(config);
    await ky.put(APIRoutes.user(), {
      json: current,
      ...BASIC_REQUEST_INIT("PUT"),
    });
    page.data.dataState.saveProgress = 50;
    await loadDbUser();
  };

  page.data.dataState.revert = () => {
    config = structuredClone(page.data.dataState.oldConfig) as any;
  };

  async function loadDbUser() {
    // Only fetch user data if it's not already loaded
    const res = await fetch(APIRoutes.user(), BASIC_GET_FETCH_INIT);

    if (res.ok) {
      const _data = await res.json();
      config = _data;

      console.log("User data loaded", _data);
      page.data.dataState.oldConfig = structuredClone(_data);
      page.data.dataState.saveProgress = 100;
    } else {
      console.error("Failed to load user data", res);
      return;
    }
  }

  onMount(async () => {
    await loadDbUser();
  });
</script>

<div class="main-wrapper max-w-lg">
  <div class="min-h-xl flex w-full grow flex-col items-center gap-5 p-4 pt-8">
    <!-- Back button -->
    <div class="w-full">
      <button class="dy-btn dy-btn-outline" onclick={goBack} disabled={page.data.dataState.saving || site.showLoading}>
        <ArrowLeft />
        Back
      </button>
    </div>

    {#if user.discord && config && !site.showLoading}
      <div class="mb-4 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-10">
        <div class="dy-avatar drop-shadow-base-100 size-24 drop-shadow-md">
          <img
            src={cdnUrls.userAvatar(user.discord?.id, user.discord?.avatar)}
            alt="User Avatar"
            class="dy-mask dy-mask-squircle size-24"
          />
        </div>
        <p class="text-2xl font-semibold">
          Hello, <span class="from-primary to-success w-fit bg-gradient-to-r bg-clip-text text-transparent"
            >{user.discord?.displayName}</span
          >!
        </p>
      </div>
      <h1 class="mb-6 text-center text-3xl font-bold">Your Preferences</h1>

      <fieldset
        class="dy-fieldset bg-base-200 border-base-300 rounded-box w-full p-4"
        class:input-while-saving={page.data.dataState.saving}
      >
        <legend class="dy-legend p-1">Your Language</legend>
        <select id="language" class="dy-select w-full" bind:value={config.language}>
          {#each LANGUAGES as lang}
            <option value={lang.value} selected={lang.value === config.language}>
              {lang.name}
            </option>
          {/each}
        </select>
        <div class="dy-alert dy-alert-warning text-xs">
          <p style="width: 100%;">
            This language will only be used in the DMs between the bot and you. It's also not always used when you are
            using buttons/etc.<br />
            <a
              href="https://docs.supportmail.dev/f/preferences#language-determination-and-usage"
              class="dy-link dy-link-primary"
              target="_blank"
            >
              Learn more about how your language preference works
            </a>
          </p>
        </div>
      </fieldset>

      <fieldset
        class="dy-fieldset bg-base-200 border-base-300 rounded-box w-full p-4"
        class:input-while-saving={page.data.dataState.saving}
      >
        <legend class="dy-legend p-1">Automatic Redirect</legend>
        <label class="dy-label">
          <input type="checkbox" class="dy-toggle dy-toggle-success" bind:checked={config.autoRedirect} />
          Automatically redirect messages to your last active ticket
        </label>
      </fieldset>

      <!-- Logout Section -->
      <a href={APIRoutes.logout()} role="button" class="dy-btn dy-btn-error dy-btn-dash w-full border-2">Logout</a>
    {:else}
      <div class="flex h-full w-full items-center justify-center">
        <LoadingDots />
      </div>
    {/if}
  </div>
  <div class="mt-auto">
    <Footer />
  </div>
</div>

{#if toast}
  <div class="dy-toast dy-toast-top dy-toast-center">
    <div class="dy-alert dy-alert-info">
      <span>{toast}</span>
    </div>
  </div>
{/if}

<SaveAlert />

<style>
  .dy-fieldset {
    user-select: none;
    -webkit-user-select: none;
  }

  .main-wrapper {
    height: 100vh;
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    margin-inline: auto;
  }
</style>
