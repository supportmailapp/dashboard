<script lang="ts">
  import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    animationDelay,
    ...restProps
  }: WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> & {
    /**
     * Delay in milliseconds before the skeleton animation starts. Useful for staggering multiple skeletons.
     */
    animationDelay?: number;
  } = $props();
</script>

<div
  bind:this={ref}
  data-slot="skeleton"
  class={cn("animate-pulse rounded-md bg-accent", className)}
  style={animationDelay ? `animation-delay: ${animationDelay}ms` : undefined}
  {...restProps}
></div>
