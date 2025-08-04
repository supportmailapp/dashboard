<script>
  import { cn } from "$lib/utils";
  import { mode } from "mode-watcher";
</script>

<div class="w-full px-2">
  <a
    href="https://venocix.de"
    target="_blank"
    id="branding"
    class={cn(
      "mx-auto my-2 flex w-full flex-col items-center justify-center gap-1 gap-x-3 rounded-lg py-2 transition-all duration-120 select-none hover:opacity-75",
      mode.current === "dark" ? "bg-auto" : "bg-foreground/80",
    )}
  >
    <span class="text-success rounded-lg px-2 py-1 font-bold">Hosted by</span>
    <img src="https://venocix.de/assets/img/logo-white.png" alt="Logo" class="w-[70%]" />
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
      animation-play-state: active;
    }
  }
</style>
