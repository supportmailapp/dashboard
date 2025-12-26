<script lang="ts">
  import { cdnUrls } from "$lib/urls";
  import { EmojiParser } from "$lib/utils/formatting";
  import { buttonVariants } from "$ui/button";
  import { Input } from "$ui/input";
  import { Label } from "$ui/label";
  import * as Popover from "$ui/popover/index.js";
  import type { IPartialEmoji } from "$lib/sm-types";

  type Props = {
    emoji: IPartialEmoji;
  };

  let { emoji = $bindable() }: Props = $props();

  $inspect("emojiinput emoji", emoji);

  // Ensure emoji.animated is always a boolean | Svelte keeps crashing out over this, i dunno why
  $effect(() => {
    if (emoji.animated === undefined) {
      emoji.animated = false;
    }
  });
</script>

<Popover.Root>
  <Popover.Trigger class={buttonVariants({ variant: "outline", class: emoji.id ? "size-14 p-2" : "" })}>
    {#if EmojiParser.isCustom(emoji)}
      <img src={cdnUrls.guildEmoji(emoji.id, 64)} alt="Emoji" class="size-10 rounded-none" />
    {:else if EmojiParser.isValid(emoji)}
      <span class="text-2xl">{EmojiParser.toString(emoji)}</span>
    {:else}
      Enter Emoji Data
    {/if}
  </Popover.Trigger>
  <Popover.Content class="h-full w-[300px] space-y-4">
    <div class="flex flex-col gap-2">
      <Label for="emoji-input-name">Emoji</Label>
      <Input
        id="emoji-input-name"
        bind:value={() => EmojiParser.toString(emoji), (v) => (emoji = EmojiParser.fromString(v, true))}
        class="w-full"
      />
      <a
        href="https://docs.supportmail.dev/version-2.1/misc/markdown-guide#emojis"
        target="_blank"
        class="text-secondary hover:underline"
      >
        How to input a custom emoji
      </a>
    </div>
  </Popover.Content>
</Popover.Root>
