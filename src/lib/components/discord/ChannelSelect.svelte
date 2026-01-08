<script lang="ts">
  import { page } from "$app/state";
  import Hash from "@lucide/svelte/icons/hash";
  import { ChannelType } from "discord-api-types/v10";

  import { getManager } from "$lib/stores/GuildsManager.svelte";
  import { APIRoutes } from "$lib/urls";
  import { cn } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import { parseDiscordLink, sortChannels } from "$lib/utils/formatting";
  import { Button } from "$ui/button";
  import * as Command from "$ui/command/index.js";
  import * as Field from "$ui/field/index.js";
  import { Input } from "$ui/input";
  import { Skeleton } from "$ui/skeleton";
  import * as Tabs from "$ui/tabs/index.js";
  import { toast } from "svelte-sonner";
  import ChannelIcon from ".//ChannelIcon.svelte";

  type Props = {
    selectedId?: string;
    excludedChannelIds?: string[];
    /**
     * The channel types to filter by.
     *
     * If empty, all channels will be allowed.
     */
    channelTypes?: APIGuildChannel["type"][];
    /**
     * Whether to allow selecting categories too instead of channels.
     *
     * @default false
     */
    selectCategories?: boolean;
    allowCustomChannels?: boolean;
    /**
     * Callback when a channel is selected. When custom channels are allowed,
     * the channel can be anything. Otherwise, it will always be a guild core channel (category depends on `selectCategories`).
     */
    onSelect?: (channel: APIGuildChannel | GuildCoreChannel, isCustom?: boolean) => void;
  };

  let {
    selectedId = $bindable(),
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
  let buttonLoading = $state(false);
  let channelButtonStyle = $state<"success" | "default">("default");
  const guildsManager = getManager();

  function isChannelExcluded(channel: GuildCoreChannel): boolean {
    return excludedChannelIds !== undefined && excludedChannelIds.includes(channel.id);
  }

  let groupedChannels = $derived.by(() => {
    const sorted = sortChannels(
        $state.snapshot(guildsManager.channels),
        true,
        (arg) => console.log("Sorted Channels:", arg),
      );
    
    // filter
    const uncategorizedFiltered = sorted.uncategorized.filter(
      (channel) => (allowAllChannels || channelTypes.includes(channel.type)) && !isChannelExcluded(channel),
    );
    const groupedFiltered = sorted.categories
      .map(({ cat, channels }) => ({
        cat,
        channels: channels.filter(
          (channel) => (allowAllChannels || channelTypes.includes(channel.type)) && !isChannelExcluded(channel),
        ),
      }))
      .filter(({ channels }) => channels.length > 0); // remove empty categories
    
    return {
      uncategorized: uncategorizedFiltered,
      categories: groupedFiltered,
    }
  });

  async function findChannelByIdOrLink() {
    if (channelIdInput === "") {
      toast.warning("Channel ID input empty.", { description: "What are you trying to do?" });
      return;
    }

    const currentInput = $state.snapshot(channelIdInput);
    const parsedLink = parseDiscordLink(currentInput);

    if (!/^\d{17,23}$/.test(channelIdInput)) {
      if (parsedLink?.channelId) {
        channelIdInput = parsedLink.channelId;
      } else {
        toast.error("Invalid Channel/Thread ID or Link.", { description: "Please provide a valid input." });
        return;
      }
    }

    buttonLoading = true;

    oldFetchInput = $state.snapshot(channelIdInput);

    let channel: APIGuildChannel | undefined = guildsManager.customChannels.get(oldFetchInput) || guildsManager.channels.find((c) => c.id === oldFetchInput);

    try {
      const res = await apiClient.get(APIRoutes.guildChannel(page.data.guildId!, oldFetchInput));

      if (!res.ok) {
        buttonLoading = false;
        throw new Error(`Failed to find channel with ID ${oldFetchInput}`);
      }

      channel = await res.json<APIGuildChannel>();
      guildsManager.customChannels.set(channel.id, channel);
    } catch (err: any) {
      buttonDisabled = true;
      buttonLoading = false;
      toast.error("Failed to find channel", { description: String(err.message ?? err) });
      await new Promise((r) =>
        setTimeout(() => {
          buttonDisabled = false;
          r(true);
        }, 4000),
      );
      return;
    }

    if (isChannelExcluded(channel as GuildCoreChannel)) {
      toast.error("Channel is excluded.", { description: "Please select a different channel." });
      buttonLoading = false;
      return;
    }
    if (!allowAllChannels && !channelTypes.includes(channel.type as any)) {
      toast.error("Invalid channel type.", { description: "Please select a different channel." });
      buttonLoading = false;
      return;
    }
    if (selectCategories === false && channel.type === ChannelType.GuildCategory) {
      toast.error("Categories cannot be selected.", { description: "Please select a different channel." });
      buttonLoading = false;
      return;
    }

    buttonLoading = false;
    selectedId = channel.id;
    onSelect?.(channel, true);
  }
</script>

{#snippet channelItem(channel: GuildCoreChannel)}
  <Command.Item
    value="{channel.id}:{channel.name}"
    class={cn(
      "cursor-pointer transition duration-80 active:scale-[99%]",
      selectedId === channel.id && "bg-muted text-muted-foreground transform-none",
    )}
    onSelect={() => onSelect?.(channel, false)}
    disabled={selectedId === channel.id}
  >
    <ChannelIcon type={channel.type} />
    {channel.name}
  </Command.Item>
{/snippet}

{#snippet channelsCommand()}
  <Command.Root class="w-full rounded-lg border shadow-md">
    <Command.Input placeholder="Search channels..." />
    <Command.List>
      {#if guildsManager.channelsLoaded}
        <Command.Empty>No channels found.</Command.Empty>
      {/if}

      {#if !guildsManager.channelsLoaded}
        {#each new Array(5) as _}
          <Command.Item disabled>
            <Hash />
            <Skeleton class="h-4 w-full" />
          </Command.Item>
        {/each}
      {:else if guildsManager.channelsLoaded && selectCategories && channelTypes.includes(ChannelType.GuildCategory)}
        <!-- The logic for selecting ONLY categories -->
        {#each groupedChannels.categories as { cat }}
          {@render channelItem(cat)}
        {/each}
      {:else}
        <!-- The logic for selecting normal channels -->
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
  <Tabs.Root value="selectChannel" class="w-full max-w-100">
    <Tabs.List class="w-full">
      <Tabs.Trigger value="selectChannel">Select Channel</Tabs.Trigger>
      <Tabs.Trigger value="customChannel">Custom Channel</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="selectChannel">
      {@render channelsCommand()}
    </Tabs.Content>
    <Tabs.Content value="customChannel" class="flex flex-col gap-2">
      <Field.Set>
        <Field.Group>
          <Field.Field class="gap-0.5">
            <Input
              bind:value={channelIdInput}
              placeholder="Channel/Thread ID or Link"
              class="placeholder:text-muted-foreground placeholder:text-sm"
            />
            <Field.Description>
              <a href="http://dis.gd/findmyid?utm_source=supportmail"
                target="_blank"
                class="underline hover:text-accent"
              >
                Where to find a Channel/Thread ID
              </a>
            </Field.Description>
          </Field.Field>
        </Field.Group>
      </Field.Set>
      <Button variant={channelButtonStyle} onclick={findChannelByIdOrLink} disabled={buttonDisabled} showLoading={buttonLoading}>
        Find Channel
      </Button>
    </Tabs.Content>
  </Tabs.Root>
{:else}
  {@render channelsCommand()}
{/if}
