<script lang="ts">
  import Branding from "$lib/assets/Branding.svelte";

  let loading = $state(false);
  let error = $state<string | null>(null);
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
  <div
    class="bg-base-100 flex h-fit w-full max-w-md flex-col gap-3 overflow-hidden rounded-2xl p-8 shadow-2xl shadow-black backdrop-blur-sm"
  >
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
          <img src="/icons/discord-mark-white.svg" alt="Discord Logo" class="h-8 w-8" />
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
    backdrop-filter: blur(0.75vh);
    filter: blur(0.75vh);
    -webkit-filter: blur(0.75vh);
    box-shadow: 0 0 200px rgba(0, 0, 0, 0.9) inset;
  }
</style>
