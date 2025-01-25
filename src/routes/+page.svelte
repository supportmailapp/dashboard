<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/state";
  import Branding from "$lib/assets/Branding.svelte";

  let { data } = $props();
</script>

<main>
  <div
    class="xy-center-items z-50 flex h-full w-max max-w-[{data.currentUser
      ? '1400px'
      : '500px'}] flex-col gap-y-5 md:h-[60%] md:gap-y-15"
  >
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
          {#if data.currentUser}
            <!-- Server Table -->
            <div class="w-full text-clip">
              <p>Placeholder</p>
            </div>
          {:else}
            <!-- Login with Discord -->
            <form method="POST" action="?/login">
              <button class="dy-btn dy-btn-lg dy-btn-soft gap-x-2 border-2">
                <img src="/discord-mark-white.svg" alt="Discord Logo" class="h-8 w-8" />
                <span>Login with Discord</span>
              </button>
            </form>
          {/if}
        </div>
      </div>
    </div>
  </div>
</main>
