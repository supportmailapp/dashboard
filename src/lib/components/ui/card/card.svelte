<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn, type WithElementRef } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    children,
    destructive = false,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    destructive?: boolean;
  } = $props();
</script>

<div
  bind:this={ref}
  data-slot="card"
  class={cn(
    "flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
    destructive ? "card-destructive" : "bg-card text-card-foreground",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</div>
