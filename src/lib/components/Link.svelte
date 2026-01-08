<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  type Props = {
    href: string;
    target?: "_self" | "_blank";
    rel?: string;
    class?: string;
    children: Snippet;
  };

  let { class: className, children, ...restProps }: Props = $props();
</script>

<a
  {...restProps}
  class={cn("inline-flex items-center gap-1 rounded bg-gray-500/50 p-1 hover:bg-gray-500/70", className)}
>
  {@render children?.()}
</a>
