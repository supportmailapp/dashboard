<script lang="ts">
  import { page } from "$app/state";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import { Label } from "$ui/label";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import ChannelSelect from "$lib/components/ChannelSelect.svelte";

  let { forumId }: { forumId: string | null } = $props();

  let currentForum = $state<GuildCoreChannel | null>(null);
  let open = $state(false);
  let channelsLoaded = $derived(page.data.guildsManager.channelsLoaded);
  let channels = $derived(channelsLoaded ? page.data.guildsManager.channels! : []);

  async function saveFn() {}

  $effect(() => {
    if (channelsLoaded) {
      currentForum = channels.find((channel) => channel.id === forumId) || null;
    } else {
      currentForum = null;
    }
  });
</script>

<ConfigCard title="Ticket Forum" description="Configure the forum where tickets will be created." {saveFn}>
  <div class="flex flex-col gap-2">
    <Popover.Root bind:open>
      <Popover.Trigger class={buttonVariants({ variant: "outline", class: "w-full max-w-xs" })}>
        {#if currentForum}
          {currentForum.name}
        {:else}
          Select a forum
        {/if}
      </Popover.Trigger>
      <Popover.Content class="w-80">
        <ChannelSelect
          onSelect={(channel) => {
            open = false;
            currentForum = channel;
          }}
        />
      </Popover.Content>
    </Popover.Root>

    {#if currentForum}
      <p class="text-sm text-gray-500">Forum ID: {currentForum.id}</p>
    {:else}
      <p class="text-sm text-red-500">No forum ID set. Tickets will not be created.</p>
    {/if}
  </div>
</ConfigCard>
