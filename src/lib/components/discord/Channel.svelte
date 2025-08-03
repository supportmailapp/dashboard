<script lang="ts">
  import type { ClassValue } from "clsx";
  import ChannelIcon from "./ChannelIcon.svelte";
  import { cn } from "$lib/utils";

  type Props = {
    channelId?: string;
    channel?: GuildCoreChannel;
    class?: ClassValue;
  };

  let { channel, channelId, class: className }: Props = $props();
</script>

<div data-slot="mention-container" class={cn(className)} data-channel-id={channel?.id}>
  <ChannelIcon type={channel?.type} class="size-4.5" />
  <span class="text-sm font-medium">
    {channel?.name ?? channelId ?? "unknown-channel"}
  </span>
</div>
