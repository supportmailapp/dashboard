<script lang="ts">
  import { enhance } from "$app/forms";
  import Branding from "$lib/assets/Branding.svelte";

  let buttonClicked = $state(false);

  const buttonBaseClasses = "dy-btn dy-btn-xl dy-btn-secondary w-full gap-x-3 border-0 bg-[#5865F2] text-white";
</script>

<div
  class="flex h-screen w-full items-center justify-center bg-[url('/login_bg.svg')] bg-cover bg-center bg-no-repeat backdrop-opacity-35"
>
  <div class="dy-hero-content text-neutral-content text-center">
    <div class="max-w-md">
      <Branding />

      <div class="h-5"></div>

      <form method="POST" action="/?login" onsubmit={(e) => console.log(e)}>
        <!-- {#if !buttonClicked} -->
        <button class={buttonBaseClasses} type="submit" onclick={() => (buttonClicked = true)}>
          <img src="/discord-mark-white.svg" alt="Discord Logo" class="aspect-auto h-6 w-6" />
          <span>Login with Discord</span>
        </button>
        <!-- {:else}
          <button class={buttonBaseClasses} disabled>
            <span class="dy-loading dy-loading-spinner"></span>
          </button>
        {/if} -->
      </form>
    </div>
  </div>
</div>
