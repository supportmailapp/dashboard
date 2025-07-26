<script lang="ts">
  import SunIcon from "@lucide/svelte/icons/sun";
  import MoonIcon from "@lucide/svelte/icons/moon";

  import { mode, setMode } from "mode-watcher";
  import { Button } from "$lib/components/ui/button/index.js";
  import { cn } from "$lib/utils";

  let isDark = $derived(mode.current === "dark");
</script>

<!-- TODO: Why the heck is the animation not working?? -->

<Button onclick={() => setMode(isDark ? "light" : "dark")} variant="outline" size="icon">
  <SunIcon
    class={cn(
      "h-[1.2rem] w-[1.2rem] transition-transform duration-150",
      !isDark ? "scale-100 rotate-0" : "scale-0 rotate-90",
    )}
  />
  <MoonIcon
    class={cn(
      "absolute h-[1.2rem] w-[1.2rem] transition-transform duration-150",
      isDark ? "scale-100 rotate-0" : "scale-0 rotate-90",
    )}
  />
  <span class="sr-only">Toggle theme</span>
</Button>
