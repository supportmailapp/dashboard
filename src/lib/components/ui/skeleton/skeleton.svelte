<script lang="ts">
  import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    delayMs = 0,
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildren<
    WithElementRef<HTMLAttributes<HTMLDivElement>> & {
      delayMs?: number;
    }
  > = $props();
</script>

<div
  bind:this={ref}
  data-slot="skeleton"
  class={cn("bg-accent animate-pulse rounded-md", className)}
  style="animation-delay: {delayMs}ms;"
  {...restProps}
></div>
