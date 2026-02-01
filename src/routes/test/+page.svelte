<script lang="ts">
  import PanelDialog from "$lib/components/panel/PanelDialog.svelte";
  import type { SMTopLevelMessageComponent } from "$lib/sm-types/src";
  import Button from "$ui/button/button.svelte";
  import { ComponentType } from "discord-api-types/v10";

  let components = $state<SMTopLevelMessageComponent[]>([
    {
      type: 10,
      content: "Hello world",
    },
    {
      type: 10,
      content: "This is a **test** message with a spoiler: ||spoiler text||",
    },
    {
      type: 1,
      components: [
        {
          action: "reply",
          type: 2,
          style: 1,
          label: "New Button",
          custom_id: "",
          emoji: "🔥",
        },
      ],
    },
    {
      type: 1,
      components: [
        {
          type: 3,
          custom_id: "panelSelect",
          options: [],
          placeholder: "Select an option",
        },
      ],
    },
  ]);

  let dialogOpen = $state(false);
</script>

<Button onclick={() => (dialogOpen = true)}>Open Panel Dialog</Button>

<PanelDialog bind:components bind:open={dialogOpen} />
