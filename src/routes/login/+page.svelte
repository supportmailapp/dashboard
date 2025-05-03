<script lang="ts">
  import Branding from "$lib/assets/Branding.svelte";
  import { roundAndFormatNumber } from "$lib/utils/formatting.js";
  import { writable } from "svelte/store";

  let loading = $state(false);
  let error = $state<string | null>(null);
  class Dimensions {
    oldWidth = 500;
    oldHeight = 500;
    width = $state(1920);
    height = $state(1080);
    formattedWidth = $derived(roundAndFormatNumber(this.width, { plus: false, comma: false }));
    formattedHeight = $derived(roundAndFormatNumber(this.height, { plus: false, comma: false }));
    constructor() {}
  }
  const dimensions = new Dimensions();
  let pictureUrl = writable<string | null>(null);

  $effect(() => {
    if (
      $pictureUrl === null ||
      Math.abs(dimensions.oldWidth - dimensions.width) > 200 ||
      Math.abs(dimensions.oldHeight - dimensions.height) > 200
    ) {
      dimensions.oldWidth = dimensions.width;
      dimensions.oldHeight = dimensions.height;
      $pictureUrl = `https://picsum.photos/${dimensions.formattedWidth}/${dimensions.formattedHeight}`;
      console.log("Updated picture URL:", $pictureUrl);
    }
  });
</script>

<svelte:window bind:innerHeight={dimensions.height} bind:innerWidth={dimensions.width} />

<div id="bg" style="background-image: url({$pictureUrl});"></div>
<!-- Static Alternative: /login_bg.svg -->
<!-- Credits, bottom right corner -->
<a
  href="https://picsum.photos/"
  target="_blank"
  rel="noopener noreferrer"
  class="text-opacity-50 absolute right-3 bottom-3 z-50 text-[0.6rem] text-slate-600"
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
