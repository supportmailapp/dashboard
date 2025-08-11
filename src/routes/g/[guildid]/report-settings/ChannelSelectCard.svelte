<script lang="ts">
  import * as Dialog from "$ui/dialog/index.js";
  import { Label } from "$ui/label";
  import Mention from "$lib/components/discord/Mention.svelte";
  import { Button } from "$ui/button";
  import { ChannelType } from "discord-api-types/v10";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import ChannelSelect from "$lib/components/ChannelSelect.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";

  type Props = {
    channel?: GuildCoreChannel;
    loading: boolean;
    saveFn: SaveFunction;
  };

  let { channel = $bindable(), loading = $bindable(), saveFn }: Props = $props();

  let modalOpen = $state(false);
</script>

<ConfigCard
  title="Alert Channel"
  description="The channel where new reports will be sent to."
  rootClass="col-span-full lg:col-span-2"
  saveFn={async () => {
    await saveFn((v) => (loading = v));
  }}
>
  <div>
    {#if !channel && loading}
      <LoadingSpinner />
    {:else if !loading && channel}
      <Mention
        {channel}
        onDelete={() => {
          channel = undefined;
          return true;
        }}
      />
    {:else}
      <Button variant="outline" size="sm" onclick={() => (modalOpen = true)}>Select Channel</Button>
    {/if}
  </div>
</ConfigCard>

<Dialog.Root bind:open={modalOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Select Alert Channel</Dialog.Title>
    </Dialog.Header>
    <div class="h-100 w-full max-w-100">
      <ChannelSelect
        selected={channel}
        channelTypes={[
          ChannelType.GuildText,
          ChannelType.GuildVoice,
          ChannelType.GuildAnnouncement,
          ChannelType.GuildStageVoice,
          ChannelType.GuildForum,
        ]}
        allowCustomChannels
        excludedChannelIds={!!channel ? [channel.id] : []}
        onSelect={(c) => {
          channel = c;
          modalOpen = false;
        }}
      />
    </div>
  </Dialog.Content>
</Dialog.Root>
