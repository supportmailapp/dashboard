<script lang="ts">
  import { page } from "$app/state";
  import Hash from "@lucide/svelte/icons/hash";
  import { ChannelType } from "discord-api-types/v10";

  import { APIRoutes } from "$lib/urls";
  import { cn } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import { sortChannels } from "$lib/utils/formatting";
  import { Button } from "$ui/button";
  import * as Command from "$ui/command/index.js";
  import { Input } from "$ui/input";
  import { Skeleton } from "$ui/skeleton";
  import * as Tabs from "$ui/tabs/index.js";
  import { toast } from "svelte-sonner";
  import ChannelIcon from "./discord/ChannelIcon.svelte";

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
    allowCustomChannels?: boolean;
    onSelect?: (channel: GuildCoreChannel) => void;
  };

  let {
    selected = $bindable(),
    channelTypes = [],
    excludedChannelIds,
    selectCategories = false,
    allowCustomChannels = false,
    onSelect,
  }: Props = $props();
  let allowAllChannels = $derived(channelTypes.length === 0);
  let channelIdInput = $state("");
  let oldFetchInput = "";
  // This not only covers the case where the input is the same, but also when empty
  let buttonDisabled = $derived(oldFetchInput == $state.snapshot(channelIdInput));
  let channelButtonStyle = $state<"success" | "default">("default");

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

  async function findChannelById() {
    if (channelIdInput === "") {
      toast.warning("Channel ID input empty.", { description: "What are you trying to do?" });
      return;
    }

    oldFetchInput = $state.snapshot(channelIdInput);

    try {
      const res = await apiClient.get(APIRoutes.guildChannel(page.data.guildId!, oldFetchInput));

      if (!res.ok) {
        throw new Error(`Failed to find channel with ID ${oldFetchInput}`);
      }

      const data = await res.json<GuildCoreChannel>();
      console.log("Fetched Channel:", data);
      selected = data;
    } catch (err: any) {
      buttonDisabled = true;
      toast.error("Failed to find channel", { description: String(err.message ?? err) });
      await new Promise((r) =>
        setTimeout(() => {
          buttonDisabled = false;
          r(true);
        }, 4000),
      );
    }
  }
</script>

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

{#snippet channelsCommand()}
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
{/snippet}

{#if allowCustomChannels}
  <Tabs.Root value="selectChannel" class="w-full max-w-[400px]">
    <Tabs.List>
      <Tabs.Trigger value="selectChannel">Select Channel</Tabs.Trigger>
      <Tabs.Trigger value="customChannel">Custom Channel</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="selectChannel">
      {@render channelsCommand()}
    </Tabs.Content>
    <Tabs.Content value="customChannel" class="flex flex-col gap-2">
      <Input
        bind:value={channelIdInput}
        placeholder="Channel/Thread ID"
        class="[&::placeholder]:text-muted-foreground [&::placeholder]:text-sm"
      />
      <Button variant={channelButtonStyle} onclick={findChannelById} disabled={buttonDisabled}>
        Find Channel
      </Button>
    </Tabs.Content>
  </Tabs.Root>
{:else}
  {@render channelsCommand()}
{/if}
