<script lang="ts">
  import { cdnUrls } from "$lib/urls";
  import { cn } from "$lib/utils";
  import { validateEmoji } from "$lib/utils/formatting";
  import { buttonVariants } from "$ui/button";
  import { Input } from "$ui/input";
  import { Label } from "$ui/label";
  import * as Popover from "$ui/popover/index.js";
  import twemoji from "@discordapp/twemoji";

  type Props = {
    emoji?: string;
  };

  let { emoji = $bindable("") }: Props = $props();

  let emojiData = $derived(validateEmoji(emoji || ""));
</script>

<Popover.Root>
  <Popover.Trigger
    class={cn(
      buttonVariants({
        variant: "outline",
        size: emojiData?.name ? "lg" : undefined,
        class: emojiData ? "p-2" : "",
      }),
      "h-12",
    )}
  >
    {#if emojiData?.id}
      <img src={cdnUrls.guildEmoji(emojiData.id, 64)} alt="Emoji" class="size-10 rounded-none" />
    {:else if emojiData?.name && twemoji.parse(emojiData.name, { className: "size-8" })}
      {@const html = twemoji.parse(emojiData.name, { className: "size-8" })}
      {@html html}
    {:else}
      Enter Emoji Data
    {/if}
  </Popover.Trigger>
  <Popover.Content class="h-full w-75 space-y-4">
    <div class="flex flex-col gap-2">
      <Label for="emoji-input-name">Emoji</Label>
      <Input id="emoji-input-name" bind:value={emoji} class="w-full" />
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
