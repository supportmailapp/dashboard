<script lang="ts">
  import { cn } from "$lib/utils";
  import type { ClassValue } from "clsx";
  import type { Snippet } from "svelte";

  let {
    children,
    class: className,
  }: {
    children?: Snippet;
    class?: ClassValue;
  } = $props();
</script>

<div class={cn("grid w-full grid-cols-1 place-items-stretch gap-4 md:grid-cols-6", className)}>
  {@render children?.()}
</div>
