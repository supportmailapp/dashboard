<script lang="ts">
  import { gg } from "$lib/stores/guild.svelte";

  export type ChannelProps = {
    id: string;
    name?: string | undefined;
  };

  let { id, name = undefined }: ChannelProps = $props();

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
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="white">
    <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
  </svg>
  <span>{String(name)}</span>
</div>
