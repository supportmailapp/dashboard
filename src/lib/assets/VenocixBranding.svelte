<script lang="ts">
  import { cn } from "$lib/utils";
  import { mode } from "mode-watcher";
  import type { ClassValue } from "clsx";

  let { class: className }: { class?: ClassValue } = $props();
</script>

<div class={cn("w-full px-2", className)}>
  <a
    href="https://venocix.de?utm_source=supportmail&utm_medium=branding&utm_campaign=dashboard"
    target="_blank"
    id="branding"
    class="mx-auto my-2 flex w-full flex-col items-center justify-center gap-1 gap-x-3 rounded-lg py-2 transition-all duration-120 select-none hover:opacity-75"
  >
    <span class="text-success rounded-lg px-2 py-1 font-bold">Hosted by</span>
    {#if mode.current !== "dark"}
      <img src="https://venocix.de/assets/img/logo.png" alt="Logo" class="w-[70%]" />
    {:else}
      <img src="https://venocix.de/assets/img/logo-white.png" alt="Logo" class="w-[70%]" />
    {/if}
  </a>
</div>

<style>
  @keyframes bop {
    0%,
    40%,
    60%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.15);
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    #branding img {
      animation: bop 3s ease-in-out infinite;
    }
  }

  /* TODO: Make a shimmer animation for the branding logo */
</style>
