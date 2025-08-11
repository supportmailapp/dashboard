<script lang="ts">
  import equal from "fast-deep-equal/es6";
  import { EntityType, type MentionableEntity } from "supportmail-types";
  import * as Card from "$ui/card/index.js";
  import * as Popover from "$ui/popover/index.js";
  import { Label } from "$ui/label";
  import Mention from "$lib/components/discord/Mention.svelte";
  import { Button, buttonVariants } from "$ui/button";
  import Plus from "@lucide/svelte/icons/plus";
  import MentionableSelect from "$lib/components/MentionableSelect.svelte";
  import { ChannelType, type APIRole, type APIUser } from "discord-api-types/v10";
  import Save from "@lucide/svelte/icons/save";
  import { MarkdownFormatter } from "$lib/utils/formatting";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import ChannelSelect from "$lib/components/ChannelSelect.svelte";
  import { page } from "$app/state";
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
  <Label>Current Channel</Label>
  <div class="bg-input/30 border-input max-h-40 w-full overflow-y-auto rounded-md border p-3">
    <div class="flex flex-wrap gap-2">
      {#if !channel && loading}
        <LoadingSpinner />
      {:else if !loading && channel}
        <Mention {channel} />
      {:else}
        <Button variant="outline" onclick={() => (modalOpen = true)}>Select Channel</Button>
      {/if}
    </div>
  </div>
</ConfigCard>

<Popover.Root bind:open={modalOpen}>
  <Popover.Content class="w-80">
    <ChannelSelect
      bind:selected={channel}
      channelTypes={[
        ChannelType.GuildText |
          ChannelType.GuildVoice |
          ChannelType.GuildAnnouncement |
          ChannelType.GuildStageVoice |
          ChannelType.GuildForum,
      ]}
      allowCustomChannels
      excludedChannelIds={!!channel ? [channel.id] : []}
    />
  </Popover.Content>
</Popover.Root>
