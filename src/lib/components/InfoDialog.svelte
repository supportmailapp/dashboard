<script lang="ts">
  import { cn } from "$lib/utils";
  import { buttonVariants } from "$ui/button";
  import * as Dialog from "$ui/dialog/index.js";
  import type { Snippet } from "svelte";

  let {
    title,
    description,
    children,
  }: { title: string; description?: string; children?: Snippet } = $props();
</script>

<Dialog.Root>
  <Dialog.Trigger class={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-7 p-0 inline-flex")} aria-label="Info">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-question-mark-icon lucide-circle-question-mark"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
    <Dialog.Title>{title}</Dialog.Title>
    {#if !!description}
      <Dialog.Description>{description}</Dialog.Description>
    {/if}
    </Dialog.Header>
    {@render children?.()}
  </Dialog.Content>
</Dialog.Root>