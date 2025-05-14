<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import Branding from "$lib/assets/Branding.svelte";
  import { site } from "$lib/stores/site.svelte";
  import { onMount } from "svelte";

  let error = $state<string>();

  onMount(() => {
    const url = new URL(page.url);
    if (url.searchParams.has("error")) {
      error = url.searchParams.get("error")!;
      url.searchParams.delete("error");
      goto(url, { replaceState: true });
    }
  });
</script>

<div id="bg" style="background-image: url(https://picsum.photos/1920/1080.webp);"></div>
<!-- Static Alternative: /login_bg.svg -->
<!-- Credits, bottom right corner -->
<a
  href="https://picsum.photos/"
  target="_blank"
  rel="noopener noreferrer"
  class="text-opacity-50 absolute right-3 bottom-3 z-50 text-[0.6rem] text-slate-600 hover:text-slate-400"
>
  Photo by <b>Picsum Photos</b>
</a>

<div class="absolute flex min-h-screen w-full items-center justify-center p-3">
  <!-- Login Card -->
  <div class="dy-card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl select-none">
    <div class="dy-card-body overflow-x-clip">
      <form
        use:enhance={() => {
          site.showLoading = true;
          return async ({ update, result }) => {
            await update({ reset: false, invalidateAll: false });
            site.showLoading = false;
            if (result.type === "success") {
              window.location.assign(result.data?.url as string);
            }
          };
        }}
        method="POST"
        class="dy-fieldset justify-center space-y-5 {site.showLoading
          ? 'pointer-events-none cursor-not-allowed opacity-80'
          : ''}"
      >
        <Branding />
        <div class="flex w-full flex-col items-center gap-2">
          <label class="dy-label">
            <input
              type="checkbox"
              name="remember"
              id="remember"
              class="dy-checkbox dy-checkbox-info dy-checkbox-sm"
              checked
            />
            Stay logged in
          </label>
          <label class="dy-label">
            <input
              type="checkbox"
              name="join-discord"
              id="join-discord"
              class="dy-checkbox dy-checkbox-info dy-checkbox-sm"
              checked
            />
            Join the Support Server
          </label>
        </div>
        <button
          class="dy-btn dy-btn-lg border-success hover:border-info dy-btn-outline gap-x-3 border-2"
          disabled={site.showLoading}
        >
          {#if site.showLoading}
            <div class="h-5 w-5 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          {:else}
            <img src="/icons/discord-mark-white.svg" alt="Discord Logo" class="h-8 w-8" />
          {/if}

          <span class="text-lg text-white">{site.showLoading ? "Logging in..." : "Login with Discord"}</span>
        </button>
        {#if error}
          <div class="dy-alert dy-alert-error shadow-md shadow-slate-700">
            <span class="text-sm">{error}</span>
          </div>
        {/if}
      </form>
    </div>
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
    backdrop-filter: blur(0.75vh);
    filter: blur(0.75vh);
    -webkit-filter: blur(0.75vh);
    box-shadow: 0 0 200px rgba(0, 0, 0, 0.9) inset;
  }
</style>
