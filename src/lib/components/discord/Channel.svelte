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

<div data-slot="mention-container" class={cn(className)} data-id={channel?.id}>
  <ChannelIcon type={channel?.type} class="size-4.5" />
  <span class="text-sm font-medium">
    {channel?.name || "unknown-channel"}
  </span>
</div>
