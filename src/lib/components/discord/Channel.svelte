<script lang="ts">
  import type { ClassValue } from "clsx";
  import ChannelIcon from "./ChannelIcon.svelte";
  import { cn } from "$lib/utils";

  type Props = {
    channel?: GuildCoreChannel;
    class?: ClassValue;
  };

  let { channel, class: className }: Props = $props();
</script>

<div
  data-slot="channel-button"
  class={cn(
    "bg-blurple/60 hover:bg-blurple/80 active:bg-blurple/80 inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 transition duration-100 select-none",
    className,
  )}
>
  <ChannelIcon type={channel?.type} class="size-5" />
  <span class="text-sm font-medium">
    {channel?.name || "Unknown Channel"}
  </span>
</div>
