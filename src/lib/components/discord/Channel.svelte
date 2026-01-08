<script lang="ts">
  import type { ClassValue } from "svelte/elements";
  import ChannelIcon from "./ChannelIcon.svelte";
  import { getManager } from "$lib/stores/GuildsManager.svelte";

  type Props = {
    channelId?: string;
    channel?: APIGuildChannel;
    class?: ClassValue;
  };

  let { channel, channelId, class: className }: Props = $props();

  const guildsManager = getManager();
  const fetchedChannel = $derived.by(() => {
    if (channel) return channel;
    if (channelId) {
      return guildsManager.channels.find((c) => c.id === channelId);
    }
    return undefined;
  });
</script>

<div data-slot="mention-container" class={className} data-channel-id={fetchedChannel?.id}>
  <ChannelIcon type={fetchedChannel?.type} class="size-4.5" />
  <span class="text-sm font-medium">
    {fetchedChannel?.name ?? channelId ?? "unknown-channel"}
  </span>
</div>
