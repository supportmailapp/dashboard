<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { cn } from "$lib/utils";
  import { buttonVariants } from "$ui/button";
  import { Checkbox } from "$ui/checkbox";
  import { Input } from "$ui/input";
  import { Label } from "$ui/label";
  import * as Popover from "$ui/popover/index.js";
  import * as RadioGroup from "$ui/radio-group";
  import type { IPartialEmoji } from "supportmail-types";

  type Props = {
    emoji?: IPartialEmoji;
    /**
     * Callback when a user is selected.
     */
    onSelect?: (emoji: IPartialEmoji) => void;
    /**
     * Custom class for the container.
     */
    class?: string;
  };

  let { emoji = $bindable({ name: "" }), onSelect, class: className }: Props = $props();

  let customEmoji = $state(false);

  function changeMode(mode: string) {
    customEmoji = mode === "custom";
    if (!customEmoji) {
      emoji = { ...emoji, id: undefined, animated: undefined };
    }
  }
</script>

<Popover.Root>
  <Popover.Trigger class={buttonVariants({ variant: "outline" })}>
    {#if emoji.name === ""}
      Select Emoji
    {:else}
      ...
    {/if}
  </Popover.Trigger>
  <Popover.Content class="h-full w-full max-w-[80px]">
    <div>
      <RadioGroup.Root
        orientation="horizontal"
        class="flex flex-row gap-8"
        value={customEmoji ? "custom" : "standard"}
        onValueChange={changeMode}
      >
        <div class="inline-flex cursor-pointer items-center gap-2 py-1 *:cursor-pointer">
          <RadioGroup.Item value="standard" id="standard" class="size-5" />
          <Label for="standard" class="text-lg">Standard</Label>
        </div>
        <div class="inline-flex cursor-pointer items-center gap-2 py-1 *:cursor-pointer">
          <RadioGroup.Item value="custom" id="custom" class="size-5" />
          <Label for="custom" class="text-lg">Custom</Label>
        </div>
      </RadioGroup.Root>
      <div class="grid gap-4">
        <div class="space-y-2">
          <h4 class="leading-none font-medium">{customEmoji ? "Custom Emoji" : "Standard Emoji"}</h4>
        </div>
        <div class="grid gap-2">
          {#if customEmoji}
            <div class="grid grid-cols-3 items-center gap-4">
              <Label for="emoji-input-id">ID</Label>
              <Input id="emoji-input-id" bind:value={emoji.id} class="col-span-2 h-8" />
            </div>
            <div class="grid grid-cols-3 items-center gap-4">
              <Label for="emoji-input-name">Name</Label>
              <Input id="emoji-input-name" bind:value={emoji.name} class="col-span-2 h-8" />
            </div>
            <div class="grid grid-cols-3 items-center gap-4">
              <Label for="emoji-input-animated">Animated?</Label>
              <Checkbox id="emoji-input-animated" bind:checked={emoji.animated} class="col-span-2 h-8" />
            </div>
          {:else}
            <div class="grid grid-cols-3 items-center gap-4">
              <Label for="emoji-input-name">Emoji</Label>
              <Input id="emoji-input-name" bind:value={emoji.name} class="col-span-2 h-8" />
            </div>
          {/if}
        </div>
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
