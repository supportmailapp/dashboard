<script lang="ts">
  import type { ClassValue } from "svelte/elements";
  import ChannelIcon from "./ChannelIcon.svelte";

  type Props = {
    channelId?: string;
    channel?: APIGuildChannel;
    class?: ClassValue;
  };

  let { channel, channelId, class: className }: Props = $props();
</script>

<div data-slot="mention-container" class={className} data-channel-id={channel?.id}>
  <ChannelIcon type={channel?.type} class="size-4.5" />
  <span class="text-sm font-medium">
    {channel?.name ?? channelId ?? "unknown-channel"}
  </span>
</div>