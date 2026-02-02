<script lang="ts">
  import EmojiPicker from "$lib/components/EmojiPicker.svelte";
  import Button from "$ui/button/button.svelte";

  let buttonBinding = $state<HTMLElement>();
  let open = $state(false);
</script>

<div bind:this={buttonBinding} class="w-fit">
  <Button onclick={() => open = !open}>Open Emoji Picker</Button>
</div>

<EmojiPicker anchor={buttonBinding} bind:open />
