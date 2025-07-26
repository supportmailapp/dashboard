<script lang="ts">
  import type { Snippet } from "svelte";
  import * as Card from "$ui/card/index.js";
  import { Button } from "$ui/button";
  import type { ClassValue } from "clsx";
  import { cn } from "$lib/utils";

  type Props = {
    title: string;
    description?: string;
    class?: ClassValue;
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
  }: Props = $props();
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>{title}</Card.Title>
    {#if description}
      <Card.Description>{description}</Card.Description>
    {/if}
  </Card.Header>
  <Card.Content class={cn(className)}>
    {@render children?.()}
  </Card.Content>
  {#if typeof saveFn !== "undefined"}
    <Card.Footer class="justify-end">
      <Button
        variant="default"
        disabled={saveBtnDisabled}
        showLoading={saveBtnLoading}
        class="w-2xs"
        onclick={saveFn}>Save</Button
      >
    </Card.Footer>
  {/if}
</Card.Root>
