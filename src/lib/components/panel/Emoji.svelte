<script lang="ts">
  import { cn } from "$lib/utils";
  import { validateEmoji } from "$lib/utils/formatting";
  import twemoji from "@discordapp/twemoji";
  import type { ClassValue } from "clsx";

  let { emoji, class: className }: { emoji: string; class?: ClassValue } = $props();
</script>

{#if !!emoji && emoji.length > 0}
  {@const parsed = validateEmoji(emoji) ?? null}
  {@const emojiUrl = `https://cdn.discordapp.com/emojis/${parsed?.id ?? ""}.webp?size=96&quality=lossless`}
  {#if parsed && !parsed.id}
    {@const html = twemoji.parse(emoji, { className: `size-5 m-0 ${className ?? ""}`.trim() })}
    {@html html}
  {:else if parsed?.id}
    <img style="width: 1.1rem; height: 1.1rem;" src={emojiUrl} alt="Button Emoji" class={cn(className)} />
  {/if}
{/if}
