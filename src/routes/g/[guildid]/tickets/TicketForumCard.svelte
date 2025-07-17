<script lang="ts">
  import { page } from "$app/state";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import { Label } from "$ui/label";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import ChannelSelect from "$lib/components/ChannelSelect.svelte";
  import * as Alert from "$lib/components/ui/alert/index.js";
  import Channel from "$lib/components/discord/Channel.svelte";
  import { Skeleton } from "$ui/skeleton";

  let { forumId }: { forumId: string | null } = $props();

  let currentForum = $state<GuildCoreChannel | null>(null);
  let setupOpen = $state(false);
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
    {#if channelsLoaded && currentForum}
      <div>
        <Channel channel={currentForum} />
      </div>
    {:else if !channelsLoaded}
      <Skeleton class="h-8 w-full" />
    {:else}
      <Alert.Root variant="warning">
        <Alert.Title>No forum set.</Alert.Title>
        <Alert.Description>Click the button below to start the setup.</Alert.Description>
      </Alert.Root>
      <Popover.Root bind:open={setupOpen}>
        <Popover.Trigger class={buttonVariants({ variant: "default", class: "my-2" })}
          >Setup Forum</Popover.Trigger
        >
        <Popover.Content class="w-80">
          <Label class="mb-2">Choose a forum channel</Label>
          <ChannelSelect />
          <Popover.Close class={buttonVariants({ variant: "secondary", className: "mt-2 w-full" })}>
            Save
          </Popover.Close>
        </Popover.Content>
      </Popover.Root>
    {/if}
  </div>
</ConfigCard>
