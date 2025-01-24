<script lang="ts">
  import { enhance } from "$app/forms";
  import Branding from "$lib/assets/Branding.svelte";

  let { data } = $props();
</script>

<main>
  <div class="xy-center-items z-50 flex h-full w-full max-w-[1400px] flex-col md:gap-y-15 gap-y-5 md:h-[60%]">
    <Branding />

    {#if data.currentUser}
      <div class="xy-center-items flex flex-col gap-y-5 text-center select-none">
        <h1 class="text-3xl font-bold">
          Welcome, <span class="text-(--dc-blurple) underline underline-offset-3">{data.currentUser.displayName}</span>!
        </h1>
        <p class="text-lg">Select a server to manage</p>
      </div>
    {/if}

    <div class="h-full w-full">
      {#if data.currentUser}
        <div class="inline-flex h-fit w-full items-center justify-center py-5 md:justify-end">
          <button class="dy-btn dy-btn-md md:dy-btn-sm dy-btn-soft border-2">Reload Servers</button>
        </div>
      {/if}

      <div class="bg-base-200 inset-shadow-md xy-center-items relative my-auto flex h-full w-full flex-col rounded-lg">
        <div class="flex flex-col gap-y-5 p-5">
          <!-- Server Table -->
          <div class="w-full text-clip">
            <p>Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>
