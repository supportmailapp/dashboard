<script lang="ts">
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import Branding from "$lib/assets/Branding.svelte";
  import { onMount } from "svelte";

  let { form } = $props();

  let loading = $state(false);
  let remember = $state(false);
  let joinDiscord = $state(true);
  $effect(() => {
    window.localStorage.setItem("keep-logged-in", String($state.snapshot(remember)));
  });

  $effect(() => {
    if (form?.url) {
      goto(form.url);
    }
  });

  onMount(() => {
    const _remember = window.localStorage.getItem("keep-logged-in");
    remember = Boolean(_remember || false);
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
    <div class="dy-card-body">
      <Branding />
      <form
        use:enhance={({}) => {
          loading = true;
          return async ({ update }) => {
            await update();
            loading = false;
          };
        }}
        method="POST"
        class="dy-fieldset justify-center space-y-2 {loading ? 'cursor-not-allowed opacity-80' : ''}"
      >
        <div class="flex w-full flex-col items-center gap-2">
          <label class="dy-label">
            <input
              type="checkbox"
              name="remember"
              id="remember"
              class="dy-checkbox dy-checkbox-accent"
              bind:checked={remember}
            />
            Keep me logged in
          </label>
          <label class="dy-label">
            <input
              type="checkbox"
              name="join-discord"
              id="join-discord"
              class="dy-checkbox dy-checkbox-accent"
              bind:checked={joinDiscord}
            />
            Join the Support Server
          </label>
        </div>
        <button class="dy-btn dy-btn-lg border-success hover:border-info dy-btn-outline gap-x-3 border-2" disabled={loading}>
          {#if loading}
            <div class="h-5 w-5 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          {:else}
            <img src="/icons/discord-mark-white.svg" alt="Discord Logo" class="h-8 w-8" />
          {/if}

          <span class="text-lg text-white">{loading ? "Logging in..." : "Login with Discord"}</span>
        </button>
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
