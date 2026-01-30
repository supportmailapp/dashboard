<script lang="ts">
  import { cn } from "$lib/utils";
  import { SeparatorSpacingSize as SpacingSize } from "discord-api-types/v10";
  import RemoveButton from "./RemoveButtonWrapper.svelte";
  import Separator from "$ui/separator/separator.svelte";
  import Checkbox from "$ui/checkbox/checkbox.svelte";
  import RemoveButtonWrapper from "./RemoveButtonWrapper.svelte";

  type Props = {
    divider?: boolean;
    spacing?: SpacingSize;
  } & ComponentWithRemoveHandler;

  let { divider = $bindable(true), spacing = $bindable(SpacingSize.Small), onRemove }: Props = $props();

  let paddingClass = $derived(spacing === SpacingSize.Small ? "py-2" : "py-4");
</script>

{#snippet paddingChanger()}
  <button
    onclick={() => (spacing = spacing === SpacingSize.Small ? SpacingSize.Large : SpacingSize.Small)}
    class={cn(
      "text-base-content w-full rounded bg-gray-600/10 text-xs transition-all duration-300 ease-in-out hover:bg-gray-600/30",
      spacing === SpacingSize.Small ? "py-1" : "py-3",
    )}
  >
    <span>{spacing === SpacingSize.Small ? "Small" : "Large"} Spacing</span>
  </button>
{/snippet}

<RemoveButtonWrapper {onRemove}>
  <div
    class="flex min-h-10 w-full flex-col items-center gap-1 transition-all duration-200 ease-in-out {paddingClass}"
  >
    {@render paddingChanger()}
    <label class="flex w-full items-center gap-2">
      <Checkbox bind:checked={divider} class="size-4 [&_svg]:size-3" />
      <Separator class={cn("w-full shrink", !divider && "bg-transparent")} />
    </label>
    {@render paddingChanger()}
  </div>
</RemoveButtonWrapper>
