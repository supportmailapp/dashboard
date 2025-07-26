<script lang="ts">
  import { cdnUrls } from "$lib/urls";
  import { buttonVariants } from "$ui/button";
  import { Checkbox } from "$ui/checkbox";
  import { Input } from "$ui/input";
  import { Label } from "$ui/label";
  import * as Popover from "$ui/popover/index.js";
  import * as RadioGroup from "$ui/radio-group";
  import type { IPartialEmoji } from "supportmail-types";

  type Props = {
    emoji: IPartialEmoji;
    /**
     * Custom class for the container.
     */
    class?: string;
  };

  let { emoji = $bindable(), class: className }: Props = $props();

  let emojiMode = $state<"standard" | "custom">("standard");

  // Ensure emoji.animated is always a boolean | Svelte keeps crashing out over this, i dunno why
  $effect(() => {
    if (emoji.animated === undefined) {
      emoji.animated = false;
    }
  });

  function changeMode(mode: string) {
    emojiMode = mode as any;
    if (emojiMode === "standard") {
      emoji = { ...$state.snapshot(emoji), id: undefined, animated: undefined };
    }
  }
</script>

<Popover.Root>
  <Popover.Trigger class={buttonVariants({ variant: "outline", class: emoji.id ? "size-14 p-2" : "" })}>
    {#if emoji.id}
      <img src={cdnUrls.guildEmoji(emoji.id, 64)} alt="Emoji" class="size-10" />
    {:else}
      Enter Emoji Data
    {/if}
  </Popover.Trigger>
  <Popover.Content class="h-full w-full max-w-[280px] space-y-4">
    <RadioGroup.Root
      orientation="horizontal"
      class="flex flex-row gap-8"
      value={emojiMode}
      onValueChange={changeMode}
    >
      <div class="inline-flex cursor-pointer items-center gap-2 py-1 *:cursor-pointer">
        <RadioGroup.Item value="standard" id="standard" />
        <Label for="standard">Standard</Label>
      </div>
      <div class="inline-flex cursor-pointer items-center gap-2 py-1 *:cursor-pointer">
        <RadioGroup.Item value="custom" id="custom" />
        <Label for="custom">Custom</Label>
      </div>
    </RadioGroup.Root>

    <div class="grid gap-4">
      <div class="space-y-2">
        <h4 class="leading-none font-medium">{emojiMode ? "Custom Emoji" : "Standard Emoji"}</h4>
      </div>
      <div class="grid gap-2">
        {#if emojiMode === "custom"}
          <div class="grid grid-cols-3 items-center gap-4">
            <Label for="emoji-input-id">ID</Label>
            <Input
              id="emoji-input-id"
              bind:value={() => emoji.id, (v) => (emoji.id = v?.replace(/\D/g, "") ?? "")}
              class="col-span-2 h-8"
            />
          </div>
          <div class="grid grid-cols-3 items-center gap-4">
            <Label for="emoji-input-name">Name</Label>
            <Input id="emoji-input-name" bind:value={emoji.name} class="col-span-2 h-8" />
          </div>
          <div class="grid grid-cols-3 items-center gap-4">
            <Label for="emoji-input-animated">Animated?</Label>
            <Checkbox id="emoji-input-animated" bind:checked={emoji.animated} class="size-6 rounded-full" />
          </div>
        {:else}
          <div class="grid grid-cols-3 items-center gap-4">
            <Label for="emoji-input-name">Emoji</Label>
            <Input id="emoji-input-name" bind:value={emoji.name} class="col-span-2" />
          </div>
        {/if}
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
