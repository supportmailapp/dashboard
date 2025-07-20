<script lang="ts">
  import { page } from "$app/state";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import { Label } from "$ui/label";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import ChannelSelect from "$lib/components/ChannelSelect.svelte";
  import * as Alert from "$lib/components/ui/alert/index.js";
  import { Skeleton } from "$ui/skeleton";
  import { ChannelType } from "discord-api-types/v10";
  import { Button } from "$ui/button/index.js";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import Mention from "$lib/components/discord/Mention.svelte";

  let { forumId: fetchedForumId }: { forumId: string | null } = $props();

  const forum = new ConfigState<GuildCoreChannel>(null);
  let channelsLoaded = $derived(page.data.guildsManager.channelsLoaded);
  let channels = $derived(channelsLoaded ? page.data.guildsManager.channels! : []);
  let newCategoryId = $state<string | null>(null);

  async function setupFn() {}

  $effect(() => {
    if (channelsLoaded) {
      forum.setConfig(channels.find((channel) => channel.id === fetchedForumId) || null);
    } else {
      forum.clear();
    }
  });

  $effect(() => {
    if (forum.loading) {
    }
  });
</script>

<ConfigCard title="Ticket Forum" description="Configure the forum where tickets will be created.">
  <div class="flex flex-col gap-2">
    {#if channelsLoaded && forum.isConfigured()}
      <div class="flex w-full items-center justify-between">
        <Mention channel={forum.config ?? undefined} fallback="c"/>
        <Button
          variant="destructive"
          onclick={() => {
            // TODO: This is jsut a placeholder, implement actual deletion logic
            fetchedForumId = null;
            forum.setConfig(null);
          }}
        >
          Reset
        </Button>
      </div>
    {:else if !channelsLoaded}
      <Skeleton class="h-8 w-full" />
    {:else}
      <div class="flex w-full flex-col">
        <Alert.Root variant="warning" class="w-full">
          <Alert.Title>No forum set.</Alert.Title>
          <Alert.Description>Click the button below to start the setup.</Alert.Description>
        </Alert.Root>
        <div class="flex gap-1">
          <p class="text-sm">The bot needs to setup the ticket forum by itself to avoid issues.</p>
          <p class="text-sm">
            You can select a category where the forum will be created, but you can also leave it empty to let
            the bot create one for you.
          </p>

          <Label class="mt-4 mb-2">Choose a category</Label>
          <ChannelSelect
            channelTypes={[ChannelType.GuildCategory]}
            selectCategories
            onSelect={(c) => (newCategoryId = c.id)}
          />
        </div>
        <Button onclick={setupFn}>Setup</Button>
      </div>
    {/if}
  </div>
</ConfigCard>
