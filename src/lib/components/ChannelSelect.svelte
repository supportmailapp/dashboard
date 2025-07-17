<script lang="ts">
  import { page } from "$app/state";
  import * as Command from "$lib/components/ui/command/index.js";
  import { sortChannels } from "$lib/utils/formatting";
  import { Skeleton } from "$ui/skeleton";
  import Hash from "@lucide/svelte/icons/hash";
  import Volume2 from "@lucide/svelte/icons/volume-2";
  import Logs from "@lucide/svelte/icons/logs";
  import { ChannelType } from "discord-api-types/v10";
  import DiscordForumIcon from "$lib/assets/DiscordForumIcon.svelte";
  import type { Component } from "svelte";
  import { SvelteMap } from "svelte/reactivity";

  type Props = {
    /**
     * The channel types to filter by.
     *
     * If empty, all channels will be allowed.
     */
    channelTypes?: GuildCoreChannelType[];
    /**
     * Whether to allow selecting categories too instead of channels.
     *
     * @default false
     */
    selectCategories?: boolean;
    onSelect?: (channel: GuildCoreChannel) => void;
  };

  let { channelTypes = [], selectCategories = false, onSelect }: Props = $props();
  let allowAllChannels = $derived(channelTypes.length === 0);

  let filteredChannels = $derived<GuildCoreChannel[]>(
    page.data.guildsManager.channels?.filter(
      (channel) => allowAllChannels || channelTypes.includes(channel.type),
    ) ?? [],
  );

  let groupedChannels = $derived.by(() =>
    sortChannels(
      filteredChannels.map((c) => c),
      true,
    ),
  );

  function channelClick(channelId: string) {
    return () => onSelect?.(filteredChannels.find((c) => c.id === channelId)!);
  }

  $inspect("ChannelSelect[filtered]", filteredChannels);
  $inspect("ChannelSelect[grouped]", groupedChannels);
</script>

{#snippet channelIcon(cType: GuildCoreChannelType)}
  {#if cType === ChannelType.GuildCategory}
    <Logs />
  {:else if cType === ChannelType.GuildStageVoice || cType === ChannelType.GuildVoice}
    <Volume2 />
  {:else if cType === ChannelType.GuildForum}
    <DiscordForumIcon />
  {:else}
    <Hash />
  {/if}
{/snippet}

{#snippet channelItem(channel: GuildCoreChannel)}
  <Command.Item
    value="{channel.id}:{channel.name}"
    class="cursor-pointer active:translate-y-[1px]"
    onclick={channelClick(channel.id)}
  >
    {@render channelIcon(channel.type)}
    {channel.name}
  </Command.Item>
{/snippet}

<Command.Root class="w-full rounded-lg border shadow-md">
  <Command.Input placeholder="Type a command or search..." />
  <Command.List>
    <Command.Empty>No channels found.</Command.Empty>
    {#if !page.data.guildsManager.channelsLoaded}
      <Command.Item disabled>
        <Hash />
        <Skeleton class="h-4 w-full" />
      </Command.Item>
      <Command.Item disabled>
        <Skeleton class="h-4 w-[75%]" />
      </Command.Item>
      <Command.Item disabled>
        <Skeleton class="h-4 w-[30%]" />
      </Command.Item>
    {:else if page.data.guildsManager.channelsLoaded && selectCategories}
      {@const joinedChannels = filteredChannels}
      {#each joinedChannels as channel}
        {@render channelItem(channel)}
      {/each}
    {:else}
      {#each groupedChannels.uncategorized as channel}
        {@render channelItem(channel)}
      {/each}
      {#each groupedChannels.categories as { cat, channels }}
        <Command.Group heading={cat.name}>
          {#each channels as channel}
            {@render channelItem(channel)}
          {/each}
        </Command.Group>
      {/each}
    {/if}
  </Command.List>
</Command.Root>
