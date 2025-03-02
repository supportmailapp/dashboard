<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import Branding from "$lib/assets/Branding.svelte";
  import { user } from "$lib/stores/user.svelte";
  import { onMount } from "svelte";

  let { data } = $props();

  let loading = $state(false);
  let error = $state("");

  onMount(async () => {
    if (user.discord) {
      goto("/");
    }

    if (page.url.searchParams.has("redirect")) {
      window.localStorage.setItem("redirect", decodeURIComponent(page.url.searchParams.get("redirect")!));
      goto("/login", { replaceState: true });
    }
  });
</script>

{#await data.unsplash then result}
  <!-- TODO: Implement Blur Hash -->
  <div id="bg" style="background-image: url('{result.urls.full}');"></div>
  <!-- Credits, bottom right corner -->
  <a
    href="https://unsplash.com/@{result.user.username}?utm_source=dyo&utm_medium=referral"
    target="_blank"
    rel="noopener noreferrer"
    class="text-opacity-50 absolute right-3 bottom-3 z-50 text-[0.6rem] text-slate-600"
  >
    Photo by {result.user.name} on Unsplash
  </a>
{/await}

<div class="absolute flex min-h-screen w-full items-center justify-center p-3">
  <!-- Login Card -->
  <div class="bg-base-200 flex h-fit w-full max-w-md flex-col gap-3 overflow-hidden rounded-2xl p-8 shadow-xl backdrop-blur-sm">
    <Branding />

    {#if error}
      <div class="mb-4 text-sm text-red-600">
        {error}
      </div>
    {/if}

    <form
      method="POST"
      class="flex items-center justify-center space-y-4 {loading ? 'cursor-not-allowed opacity-80' : ''}"
      onsubmit={() => (loading = true)}
    >
      <button class="dy-btn dy-btn-lg border-success hover:border-info dy-btn-outline gap-x-3 border-2" disabled={loading}>
        {#if loading}
          <div class="h-5 w-5 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
        {:else}
          <img src="/discord-mark-white.svg" alt="Discord Logo" class="h-8 w-8" />
        {/if}

        <span class="text-lg text-white">{loading ? "Logging in..." : "Login with Discord"}</span>
      </button>
    </form>
  </div>
</div>

<style>
  #bg {
    width: 100%;
    height: 100%;
    position: absolute;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    object-fit: cover;
    backdrop-filter: blur(1vh);
    filter: blur(1vh);
    -webkit-filter: blur(1vh);
    box-shadow: 0 0 200px rgba(0, 0, 0, 0.9) inset;
  }
</style>
