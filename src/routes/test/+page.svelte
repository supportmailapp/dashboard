<script lang="ts">
  import PanelEditor from "$lib/components/panel/PanelEditor.svelte";
  import type { SMTopLevelMessageComponent } from "$lib/sm-types/src";
  import { ComponentType } from "discord-api-types/v10";

  let components = $state<SMTopLevelMessageComponent[]>([
    {
      type: ComponentType.TextDisplay,
      content: "This is a text display component.",
    },
  ]);
</script>

<PanelEditor bind:components />
