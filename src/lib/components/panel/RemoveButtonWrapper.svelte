<script lang="ts">
  import Button from "$ui/button/button.svelte";
  import XIcon from "@lucide/svelte/icons/x";
  import type { Snippet } from "svelte";
  let { onRemove = () => undefined, children }: { onRemove?: () => void; children?: Snippet } = $props();
</script>

<div class="flex flex-row items-start gap-0.5 w-full">
  <div class="flex-1">
    {@render children?.()}
  </div>
  <Button
    variant="ghost"
    size="icon-sm"
    class="size-4 p-1 text-destructive"
    aria-label="Remove component"
    onclick={onRemove}
  >
    <XIcon class="size-4" />
  </Button>
</div>
