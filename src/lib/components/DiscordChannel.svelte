<script lang="ts">
  import DcThreadIcon from "$lib/assets/DCThreadIcon.svelte";
  import { gg } from "$lib/stores/guild.svelte";
  import { AlignJustify, Hash } from "@lucide/svelte";

  export type ChannelProps = {
    id: string;
    name?: string | undefined;
    typ?: "thread" | "channel" | "category" | undefined;
  };

  let { id, name = undefined, typ = "channel" }: ChannelProps = $props();

  $effect(() => {
    if (!name) {
      name = gg.channels?.find((c) => c.id == id)?.name;
    }
  });

  function clickFunction(_: any) {
    navigator.clipboard.writeText(id);
    alert("Copied channel ID to clipboard!");
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
<div class="discord-channel" onclickcapture={clickFunction}>
  {#if typ === "thread"}
    <DcThreadIcon />
  {:else if typ === "category"}
    <AlignJustify />
  {:else}
    <Hash />
  {/if}
  <span>{String(name)}</span>
</div>
