<script lang="ts">
  import * as Dialog from "$ui/dialog/index.js";
  import { Label } from "$ui/label";
  import Mention from "$lib/components/discord/Mention.svelte";
  import { Button } from "$ui/button";
  import { ChannelType } from "discord-api-types/v10";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import ChannelSelect from "$lib/components/ChannelSelect.svelte";

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
  description="Select the channel where new reports get sent to."
  rootClass="col-span-full lg:col-span-2"
  saveFn={async () => {
    await saveFn((v) => (loading = v));
  }}
  saveBtnLoading={loading}
  saveBtnDisabled={loading}
>
  <div class="flex flex-col items-start gap-2" class:opacity-50={loading} class:pointer-events-none={loading}>
    <Label>Alert Channel</Label>
    {#if !channel}
      <Button variant="outline" size="sm" onclick={() => (modalOpen = true)}>Select Channel</Button>
    {:else}
      <Mention
        {channel}
        onDelete={() => {
          channel = undefined;
          return true;
        }}
      />
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