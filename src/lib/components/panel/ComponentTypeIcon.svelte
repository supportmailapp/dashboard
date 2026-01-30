<script lang="ts">
  import type { SMTopLevelMessageComponent } from "$lib/sm-types/src";
  import { ComponentType } from "discord-api-types/v10";

  import TextAlignStart from "@lucide/svelte/icons/text-align-start";
  import Box from "@lucide/svelte/icons/box";
  import Minus from "@lucide/svelte/icons/minus";
  import BanknoteArrowUp from "@lucide/svelte/icons/banknote-arrow-up";
  import LayoutTemplate from "@lucide/svelte/icons/layout-template";
  import Images from "@lucide/svelte/icons/images";

  let { type }: { type: SMTopLevelMessageComponent["type"] } = $props();
</script>

{#if type === ComponentType.TextDisplay}
  <TextAlignStart class="inline-block text-inherit" />
{:else if type === ComponentType.Container}
  <Box class="inline-block text-inherit" />
{:else if type === ComponentType.Separator}
  <Minus class="inline-block text-inherit" />
{:else if type === ComponentType.ActionRow}
  <BanknoteArrowUp class="inline-block text-inherit" />
{:else if type === ComponentType.Section}
  <LayoutTemplate class="inline-block text-inherit" />
{:else}
  <!-- Media Gallery -->
  <Images class="inline-block text-inherit" />
{/if}
