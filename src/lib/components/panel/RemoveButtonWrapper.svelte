<script lang="ts">
  import { cn } from "$lib/utils";
  import Button from "$ui/button/button.svelte";
  import XIcon from "@lucide/svelte/icons/x";
  import type { ClassValue } from "clsx";
  import type { Snippet } from "svelte";
  let {
    onRemove = () => undefined,
    class: className,
    children,
  }: { onRemove?: () => void; class?: ClassValue; children?: Snippet } = $props();
</script>

<div class={cn("flex w-full flex-row items-start gap-0.5", className)}>
  <div class="flex-1 min-w-0">
    {@render children?.()}
  </div>
  <Button
    variant="ghost"
    size="icon-sm"
    class="text-destructive size-4 p-1"
    aria-label="Remove component"
    onclick={onRemove}
  >
    <XIcon class="size-4" />
  </Button>
</div>
