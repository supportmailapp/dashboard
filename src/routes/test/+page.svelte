<script lang="ts">
  import Button from "$lib/components/panel/Button.svelte";
  import PanelEditor from "$lib/components/panel/PanelEditor.svelte";
  import type { SMTopLevelMessageComponent } from "$lib/sm-types/src";
  import { ComponentType } from "discord-api-types/v10";

  let components = $state<SMTopLevelMessageComponent[]>([
    {
      type: ComponentType.TextDisplay,
      content: "This is a text display component.",
    },
    {
      type: ComponentType.MediaGallery,
      items: [],
    },
  ]);
</script>

<PanelEditor bind:components />
