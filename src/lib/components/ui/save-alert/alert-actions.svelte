<script lang="ts">
  import { cn, type WithElementRef } from "$lib/utils.js";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="alert-actions"
  class={cn("inline-flex w-full sm:w-fit justify-center items-center gap-2 h-full", className)}
  {...restProps}
>
  {@render children?.()}
</div>
