<script lang="ts">
  import type { ClassValue } from "svelte/elements";
  import ChannelIcon from "./ChannelIcon.svelte";
  import { getManager } from "$lib/stores/GuildsManager.svelte";
  import { browser } from "$app/environment";

  type Props = {
    channelId?: string;
    channel?: APIGuildChannel;
    class?: ClassValue;
    dontRetry?: boolean;
  };

  let { channel, channelId, class: className, dontRetry }: Props = $props();

  const guildsManager = getManager();
  let fetchedChannel = $state<APIGuildChannel | null>(null);

  $effect(() => {
    if (!browser) return;
    if (channel) {
      fetchedChannel = channel;
      return;
    }
    if (!channelId) {
      fetchedChannel = null;
      return;
    }
    guildsManager.fetchChannelById(channelId, !dontRetry).then((ch) => {
      fetchedChannel = ch ?? null;
    });
  });
</script>

<div data-slot="mention-container" class={className} data-channel-id={fetchedChannel?.id}>
  <ChannelIcon type={fetchedChannel?.type} class="size-4.5" />
  <span class="text-sm font-medium">
    {fetchedChannel?.name ?? channelId ?? "unknown-channel"}
  </span>
</div>
