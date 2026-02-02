<script lang="ts">
  import type { IPartialEmoji } from "$lib/sm-types/src";
  import { cn } from "$lib/utils";
  import { validateEmoji } from "$lib/utils/formatting";
  import twemoji from "@discordapp/twemoji";
  import type { ClassValue } from "clsx";

  let {
    emoji,
    data,
    class: className,
  }: { emoji?: string; data?: IPartialEmoji; class?: ClassValue } = $props();
  let parsedEmoji = $derived(data ? data : emoji ? (validateEmoji(emoji) ?? null) : null);
  let stringifiedEmoji = $derived(
    parsedEmoji
      ? parsedEmoji.id
        ? `<${parsedEmoji.animated ? "a" : ""}:${parsedEmoji.name}:${parsedEmoji.id}>`
        : parsedEmoji.name
      : null,
  );
</script>

{#if parsedEmoji && stringifiedEmoji}
  {#if !stringifiedEmoji?.startsWith("<:")}
    {@const html = twemoji.parse(stringifiedEmoji, { className: `size-5 m-0 ${className ?? ""}`.trim() })}
    {@html html}
  {:else}
    {@const emojiUrl = `https://cdn.discordapp.com/emojis/${parsedEmoji?.id ?? ""}.${parsedEmoji?.animated ? "gif" : "webp"}?size=96&quality=lossless`}
    <img src={emojiUrl} alt="Button Emoji" class={cn("size-[1.1rem]", className)} />
  {/if}
{/if}
