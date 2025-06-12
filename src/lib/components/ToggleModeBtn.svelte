<script lang="ts">
  import BlendIcon from "@lucide/svelte/icons/blend";

  import { toggleMode, mode } from "mode-watcher";
  import { Button } from "$lib/components/ui/button/index.js";
  import { cn } from "$lib/utils";

  let isDark = $derived(mode.current?.toString() === "dark");
</script>

<Button onclick={toggleMode} variant="outline" size="icon">
  <BlendIcon
    class={cn(
      "size-[1.2rem] transition-transform duration-500 ease-in-out",
      isDark ? "rotate-90" : "rotate-0",
    )}
  />
  <span class="sr-only">Toggle theme</span>
</Button>
