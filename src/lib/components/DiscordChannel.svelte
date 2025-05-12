<script lang="ts">
  import { discordChannelTypeToBasic } from "$lib";
  import DcThreadIcon from "$lib/assets/DCThreadIcon.svelte";
  import { gg } from "$lib/stores/guild.svelte";
  import { AlignJustify, Hash, Volume2 } from "@lucide/svelte";
  import type { ChannelType } from "discord.js";

  type ChannelProps = {
    id: string;
    name?: string | undefined;
    typ?: "thread" | "channel" | "category" | "voice";
    discordType?: ChannelType;
    /**
     * If true, the channel name will be cut off at 10rem (160px) and will show an ellipsis.
     */
    cutLength?: boolean;
    clickFn?:
      | undefined
      | ((
          e: MouseEvent & {
            currentTarget: EventTarget & HTMLDivElement;
          },
        ) => void);
  };

  let {
    id,
    name = undefined,
    typ = "channel",
    discordType = undefined,
    cutLength = false,
    clickFn = undefined,
  }: ChannelProps = $props();
  const channelClasses = {
    category: "category",
    thread: "", // Uses default channel class
    channel: "",
    voice: "",
  };

  $effect(() => {
    if (!name) {
      name = gg.channels?.find((c) => c.id == id)?.name;
    }
  });

  $effect(() => {
    if (discordType) {
      typ = discordChannelTypeToBasic(discordType);
    }
  });
</script>

<div
  class="discord-mention {channelClasses[typ]}"
  onclickcapture={(e) => {
    if (clickFn !== undefined) {
      return clickFn(e);
    }
    navigator.clipboard.writeText(id);
    alert(`Copied ${typ} ID to clipboard!`);
    e.stopPropagation();
  }}
>
  {#if typ === "thread"}
    <DcThreadIcon />
  {:else if typ === "category"}
    <AlignJustify />
  {:else if typ === "voice"}
    <Volume2 />
  {:else}
    <Hash />
  {/if}
  <span class={cutLength ? "w-fit max-w-40 truncate" : ""}>{String(name)}</span>
</div>
