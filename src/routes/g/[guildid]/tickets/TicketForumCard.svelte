<script lang="ts">
  import { page } from "$app/state";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import { Label } from "$ui/label";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import ChannelSelect from "$lib/components/ChannelSelect.svelte";
  import * as Alert from "$lib/components/ui/alert/index.js";
  import Channel from "$lib/components/discord/Channel.svelte";
  import { Skeleton } from "$ui/skeleton";
  import { ChannelType } from "discord-api-types/v10";
  import { Button } from "$ui/button/index.js";

  let { forumId }: { forumId: string | null } = $props();

  let forum = $state<GuildCoreChannel | null>(null);
  let setupOpen = $state(false);
  let channelsLoaded = $derived(page.data.guildsManager.channelsLoaded);
  let channels = $derived(channelsLoaded ? page.data.guildsManager.channels! : []);
  let newCategoryId = $state<string | null>(null);

  async function saveFn() {}

  $effect(() => {
    if (channelsLoaded) {
      forum = channels.find((channel) => channel.id === forumId) || null;
    } else {
      forum = null;
    }
  });
</script>

<ConfigCard title="Ticket Forum" description="Configure the forum where tickets will be created." {saveFn}>
  <div class="flex flex-col gap-2">
    {#if channelsLoaded && forum}
      <div class="flex w-full items-center justify-between">
        <Channel channel={forum} />
        <Button
          variant="destructive"
          onclick={() => {
            // TODO: This is jsut a placeholder, implement actual deletion logic
            forumId = null;
            forum = null;
          }}
        >
          Reset
        </Button>
      </div>
    {:else if !channelsLoaded}
      <Skeleton class="h-8 w-full" />
    {:else}
      <Alert.Root variant="warning">
        <Alert.Title>No forum set.</Alert.Title>
        <Alert.Description>Click the button below to start the setup.</Alert.Description>
      </Alert.Root>
      <Dialog.Root bind:open={setupOpen}>
        <Dialog.Trigger class={buttonVariants({ variant: "outline", class: "my-2" })}>
          Setup Forum
        </Dialog.Trigger>
        <Dialog.Content class="w-80 space-y-2">
          <p class="text-sm">The bot needs to setup the ticket forum by itself to avoid issues.</p>
          <p class="text-sm">
            You can select a category where the forum will be created, but you can also leave it empty to let
            the bot create one for you.
          </p>
          <Label class="mb-2">Choose a category</Label>
          <ChannelSelect channelTypes={[ChannelType.GuildCategory]} selectCategories />

          <Dialog.Footer>
            <Dialog.Close
              class={buttonVariants({ variant: "outline" })}
              onclick={() => (newCategoryId = null)}
            >
              Cancel
            </Dialog.Close>
            <Button variant="default">Setup</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    {/if}
  </div>
</ConfigCard>
