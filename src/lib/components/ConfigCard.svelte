<script lang="ts">
  import type { Snippet } from "svelte";
  import * as Card from "$ui/card/index.js";
  import { Button } from "$ui/button";
  import type { ClassValue } from "clsx";
  import { cn } from "$lib/utils";
  import Save from "@lucide/svelte/icons/save";

  type Props = {
    title?: string;
    description?: string;
    class?: ClassValue;
    rootClass?: ClassValue;
    saveBtnDisabled?: boolean;
    saveBtnLoading?: boolean;
    saveFn?: () => void | Promise<void>;
    children?: Snippet;
  };
  let {
    children,
    saveFn,
    title,
    description,
    class: className,
    saveBtnDisabled,
    saveBtnLoading,
    rootClass = "",
  }: Props = $props();
</script>

<Card.Root class={cn(rootClass)}>
  {#if !!title || !!description}
    <Card.Header>
      {#if title}
        <Card.Title>{title}</Card.Title>
      {/if}
      {#if description}
        <Card.Description>{description}</Card.Description>
      {/if}
    </Card.Header>
  {/if}
  <Card.Content class={cn(className)}>
    {@render children?.()}
  </Card.Content>
  {#if typeof saveFn !== "undefined"}
    <Card.Footer class="justify-end">
      <Button
        variant="default"
        disabled={saveBtnDisabled}
        showLoading={saveBtnLoading}
        class="w-[100px]"
        onclick={saveFn}
      >
        <Save class="mr-0.5 size-4" />
        Save
      </Button>
    </Card.Footer>
  {/if}
</Card.Root>
