<script lang="ts">
  import type { Snippet } from "svelte";
  import * as Card from "$ui/card/index.js";
  import { Button } from "$ui/button";

  type Props = {
    title: string;
    description?: string;
    saveFn: () => void | Promise<void>;
    children?: Snippet;
  };
  let { children, saveFn, title, description }: Props = $props();
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>{title}</Card.Title>
    {#if description}
      <Card.Description>{description}</Card.Description>
    {/if}
  </Card.Header>
  <Card.Content>
    {@render children?.()}
  </Card.Content>
  <Card.Footer class="justify-end">
    <Button variant="default" onclick={saveFn}>Save</Button>
  </Card.Footer>
</Card.Root>
