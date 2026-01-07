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
    children?: Snippet;
  };
  let {
    children,
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
</Card.Root>
