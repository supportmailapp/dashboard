<script lang="ts">
  import { page } from "$app/state";
  import Hash from "@lucide/svelte/icons/hash";
  import { ChannelType } from "discord-api-types/v10";

  import ChannelIcon from "./discord/ChannelIcon.svelte";
  import * as Command from "$lib/components/ui/command/index.js";
  import { sortChannels } from "$lib/utils/formatting";
  import { Skeleton } from "$ui/skeleton";
  import { cn } from "$lib/utils";

  type Props = {
    selected?: GuildCoreChannel;
    excludedChannelIds?: string[];
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

  let {
    selected = $bindable(),
    channelTypes = [],
    excludedChannelIds,
    selectCategories = false,
    onSelect,
  }: Props = $props();
  let allowAllChannels = $derived(channelTypes.length === 0);

  function isChannelExcluded(channel: GuildCoreChannel): boolean {
    return excludedChannelIds !== undefined && excludedChannelIds.includes(channel.id);
  }

  let filteredChannels = $derived<GuildCoreChannel[]>(
    page.data.guildsManager.channels?.filter(
      (channel) => (allowAllChannels || channelTypes.includes(channel.type)) && !isChannelExcluded(channel),
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

<!-- TODO: Find a way to display the current selected channel differently -->
{#snippet channelItem(channel: GuildCoreChannel)}
  <Command.Item
    value="{channel.id}:{channel.name}"
    class={cn(
      "cursor-pointer transition duration-80 active:scale-[99%]",
      selected?.id === channel.id && "bg-accent-foreground text-accent transform-none",
    )}
    onSelect={channelClick(channel.id)}
    disabled={selected?.id === channel.id}
  >
    <ChannelIcon type={channel.type} />
    {channel.name}
  </Command.Item>
{/snippet}

<Command.Root class="w-full rounded-lg border shadow-md">
  <Command.Input placeholder="Search channels..." />
  <Command.List>
    <Command.Empty>No channels found.</Command.Empty>
    {#if !page.data.guildsManager.channelsLoaded}
      {#each new Array(3) as _}
        <Command.Item disabled>
          <Hash />
          <Skeleton class="h-4 w-full" />
        </Command.Item>
      {/each}
    {:else if page.data.guildsManager.channelsLoaded && selectCategories && channelTypes.includes(ChannelType.GuildCategory)}
      <!-- The logic for selecting everything BUT categories -->
      {@const joinedChannels = filteredChannels}
      {#each joinedChannels as channel}
        {@render channelItem(channel)}
      {/each}
    {:else if page.data.guildsManager.channelsLoaded && selectCategories && channelTypes.includes(ChannelType.GuildCategory)}
      <!-- The logic for selecting ONLY categories -->
      {#each groupedChannels.categories as { cat, channels }}
        {@render channelItem(cat)}
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
