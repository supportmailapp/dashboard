<script lang="ts">
  import { page } from "$app/state";
  import Button from "$ui/button/button.svelte";
  import SquareArrowOutUpRight from "@lucide/svelte/icons/square-arrow-out-up-right";

  let channelid = $derived(page.params.channelid);

  // automatic redirect, immediately
  $effect(() => {
    if (channelid) {
      new Promise((resolve) => {
        setTimeout(resolve, 1000);
      }).then(() => {
        window.location.href = `https://discord.com/channels/@me/${channelid}`;
      });
    }
  });
</script>

<div class="flex h-screen w-full items-center justify-center">
  <div class="bg-background/80 flex flex-col items-center gap-6 rounded-lg p-8 shadow-lg">
    <h1 class="text-2xl font-bold italic">Redirecting to DM...</h1>
    <Button
      variant="secondary"
      onclick={() => (window.location.href = `https://discord.com/channels/@me/${channelid}`)}
    >
      Click here if you are not redirected automatically
      <SquareArrowOutUpRight />
    </Button>
  </div>
</div>
