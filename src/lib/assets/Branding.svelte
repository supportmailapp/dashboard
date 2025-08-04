<script>
  import { cn } from "$lib/utils";
  import { mode } from "mode-watcher";
</script>

<a
  href="https://supportmail.dev"
  target="_blank"
  id="branding"
  class="flex flex-row items-center justify-center gap-x-3 transition-opacity duration-120 select-none hover:opacity-75"
>
  <img src="/logo.png" alt="Logo" class="size-14 drop-shadow-md" />
  <span class={cn("text-2xl font-bold sm:text-3xl", mode.current === "dark" ? "text-white" : "text-black")}>
    SupportMail
  </span>
</a>
