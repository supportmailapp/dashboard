<script lang="ts">
  import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
  import { Button } from "$ui/button/index.js";
  import * as DropdownMenu from "$ui/dropdown-menu/index.js";

  let {
    _id,
    onEdit,
    onDelete,
  }: {
    _id: string;
    onEdit: (id: string) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
  } = $props();
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="ghost" size="icon" class="relative size-8 p-0">
        <span class="sr-only">Open menu</span>
        <EllipsisIcon />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item variant="default" onclick={() => onEdit(_id)}>Edit Entry</DropdownMenu.Item>
    <DropdownMenu.Item variant="destructive" onclick={() => onDelete(_id)}>Delete Entry</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
