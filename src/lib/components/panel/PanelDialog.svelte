<script lang="ts">
  import type { SMTopLevelMessageComponent } from "$lib/sm-types/src";
  import Button from "$ui/button/button.svelte";
  import * as Dialog from "$ui/dialog/index.js";
  import * as Tabs from "$ui/tabs/index.js";
  import Files from "@lucide/svelte/icons/files";
  import PanelEditor from "./PanelEditor.svelte";
  import { toast } from "svelte-sonner";
  import PanelDisplay, { resetClickedSpoilers } from "./PanelDisplay.svelte";
  import X from "@lucide/svelte/icons/x";

  interface Props {
    open?: boolean;
    components?: SMTopLevelMessageComponent[];
  }

  let { open = $bindable(false), components = $bindable([]) }: Props = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    class="dark flex h-[calc(100vh-2rem)] w-screen max-w-screen flex-col sm:w-full sm:max-w-[calc(100vw-2rem)]"
    style="color-scheme: dark;"
    showCloseButton={false}
  >
    <Tabs.Root
      value="preview"
      onValueChange={(newTab) => {
        if (newTab === "edit" || newTab === "preview") {
          resetClickedSpoilers();
        }
      }}
      class="flex flex-1 flex-col overflow-hidden"
    >
      <div class="mt-3 flex items-center justify-between gap-2">
        <Tabs.List class="flex-1 shrink-0">
          <Tabs.Trigger value="edit">Edit</Tabs.Trigger>
          <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
          <Tabs.Trigger value="raw">Raw</Tabs.Trigger>
        </Tabs.List>
        <Button
          variant="outline"
          size="icon-sm"
          class="text-destructive"
          onclick={() => {
            open = false;
          }}
        >
          <X />
        </Button>
      </div>
      <Tabs.Content value="edit" class="mt-4 flex flex-1 flex-col overflow-y-auto">
        <PanelEditor bind:components />
      </Tabs.Content>
      <Tabs.Content value="preview" class="mt-4 flex flex-col overflow-y-auto">
        <PanelDisplay {components} />
      </Tabs.Content>
      <Tabs.Content value="raw" class="mt-4 flex flex-col overflow-hidden">
        <div class="bg-card relative flex flex-1 overflow-hidden rounded border p-4">
          <div class="flex w-full overflow-y-auto font-mono text-sm whitespace-pre-wrap">
            {JSON.stringify(components, null, 2)}
          </div>
          <Button
            variant="secondary"
            size="icon"
            class="absolute top-4 right-4"
            onclick={() => {
              navigator.clipboard.writeText(JSON.stringify(components, null, 2)).then(() => {
                toast.success("Copied to clipboard");
              });
            }}
          >
            <Files />
          </Button>
        </div>
      </Tabs.Content>
    </Tabs.Root>
  </Dialog.Content>
</Dialog.Root>
