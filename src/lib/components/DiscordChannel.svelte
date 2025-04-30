<script lang="ts">
  import DcThreadIcon from "$lib/assets/DCThreadIcon.svelte";
  import { gg } from "$lib/stores/guild.svelte";
  import { AlignJustify, Hash } from "@lucide/svelte";

  export type ChannelProps = {
    id: string;
    name?: string | undefined;
    typ?: "thread" | "channel" | "category";
    /**
     * If true, the channel name will be cut off at 10rem (160px) and will show an ellipsis.
     */
    cutLength?: boolean;
  };

  let { id, name = undefined, typ = "channel", cutLength = false }: ChannelProps = $props();
  const channelClasses = {
    category: "category",
    thread: "", // Uses default channel class
    channel: "", // Uses default channel class
  };

  $effect(() => {
    if (!name) {
      name = gg.channels?.find((c) => c.id == id)?.name;
    }
  });
</script>

<div
  class="discord-mention {channelClasses[typ]}"
  onclickcapture={function clickFunction(_: any) {
    navigator.clipboard.writeText(id);
    alert(`Copied ${typ} ID to clipboard!`);
  }}
>
  {#if typ === "thread"}
    <DcThreadIcon />
  {:else if typ === "category"}
    <AlignJustify />
  {:else}
    <Hash />
  {/if}
  <span class={cutLength ? "w-fit max-w-40 truncate" : ""}>{String(name)}</span>
</div>
