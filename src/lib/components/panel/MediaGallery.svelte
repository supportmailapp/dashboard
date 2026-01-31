<script lang="ts">
  import type { SMMediaItem } from "$lib/sm-types/src";
  import Button from "$ui/button/button.svelte";
  import Plus from "@lucide/svelte/icons/plus";
  import MediaItem from "./MediaItem.svelte";
  import RemoveButtonWrapper from "./RemoveButtonWrapper.svelte";
  import { toast } from "svelte-sonner";

  type Props = ComponentWithRemoveHandler<{
    items: SMMediaItem[];
    totalComponents: number;
  }>;

  let { items = $bindable([]), totalComponents, onRemove }: Props = $props();

  function addItem() {
    if (items.length >= 10) {
      toast.error("You cannot add more than 10 items.");
      return;
    } else if (totalComponents >= 25) {
      toast.error("You cannot have more than 25 components in total.");
      return;
    }
    items = [...items, { url: "", description: "", spoiler: false }];
  }
</script>

<div class="block">
  <RemoveButtonWrapper {onRemove}>
    <div class="flex h-auto w-full flex-wrap gap-2 rounded border p-2">
      {#each items as item, index}
        <MediaItem
          inGallery
          bind:url={item.url}
          bind:description={item.description}
          bind:spoiler={item.spoiler}
          onRemove={() => (items = items.filter((_, i) => i !== index))}
        />
      {/each}
      {#if items.length < 10 && totalComponents < 25}
        <Button variant="outline" size="icon-lg" onclick={addItem} class="size-30">
          <Plus class="size-8" />
        </Button>
      {/if}
    </div>
  </RemoveButtonWrapper>
</div>
