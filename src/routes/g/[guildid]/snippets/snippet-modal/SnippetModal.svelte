<script lang="ts">
  import * as Dialog from "$ui/dialog/index.js";
  import * as Tooltip from "$ui/tooltip/index.js";
  import { Input } from "$ui/input";
  import { Label } from "$ui/label";
  import Info from "@lucide/svelte/icons/info";
  import SnippetContentTabs from "./SnippetContentTabs.svelte";
  import { Button } from "$ui/button";

  type Props = {
    open: boolean;
    name: string;
    content: string;
    onSave?: () => Promise<any>;
    loading: boolean;
  };

  let {
    open = $bindable(true),
    name = $bindable(""),
    content = $bindable(""),
    onSave,
    loading = $bindable(false),
  }: Props = $props();

  let nameError = $state(false);

  async function onClickFn() {
    if (name === "") {
      nameError = true;
      return;
    }
    nameError = false;
    await onSave?.();
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="flex h-[40rem] w-full max-w-[calc(100vw-10px)] flex-col sm:max-w-3xl">
    <div class="flex h-25 flex-col items-start justify-start gap-2">
      <Label class="font-medium">
        <span>Snippet Name</span>
        <Tooltip.Provider delayDuration={100}>
          <Tooltip.Root open={false} disableCloseOnTriggerClick>
            <Tooltip.Trigger>
              <Info class="text-muted-foreground size-4" />
            </Tooltip.Trigger>
            <Tooltip.Content forceMount={false} side="top" align="center">
              The name can only contain lowercase alphanumeric characters, underscores and spaces.
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      </Label>
      <Input placeholder="Enter snippet name" bind:value={name} aria-invalid={nameError} />
      {#if nameError}
        <p class="text-destructive text-sm italic">Snippet name is required.</p>
      {/if}
    </div>

    <div class="flex min-h-0 flex-1 flex-col gap-2 py-3">
      <Label class="font-medium">Snippet Content</Label>
      <div class="min-h-0 flex-1">
        <SnippetContentTabs bind:content />
      </div>
    </div>
    <Dialog.Footer>
      <Button
        variant="default"
        type="submit"
        class="w-full"
        onclick={onClickFn}
        disabled={loading}
        showLoading={loading}
      >
        Save Snippet
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
