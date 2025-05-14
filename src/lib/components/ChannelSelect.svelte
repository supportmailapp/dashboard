<script lang="ts">
  import { gg } from "$lib/stores/guild.svelte";
  import { scale } from "svelte/transition";
  import { type Snippet } from "svelte";
  import DiscordChannel from "./DiscordChannel.svelte";
  import LoadingDots from "./LoadingDots.svelte";
  import { compareChannelTypes } from "$lib";
  import { ChannelType } from "discord-api-types/v10";
  import { sortChannels } from "$lib/utils/formatting";
  import type { ClassValue } from "svelte/elements";

  type BasicChannelType = "channel" | "thread" | "category" | "voice";

  type Props = {
    /**
     * An array of channel IDs to exclude from the selection.
     */
    exclude?: string[];
    /**
     * An array of channel types to include in the selection.
     * If not provided, all channel types will be included.
     */
    basicChannelTypes?: BasicChannelType[];
    show: boolean;
    /**
     * The text to display in the dialog. If not provided, no text will be shown.
     */
    text?: string;
    class?: ClassValue;
    /**
     * Callback function to be called when a channel is selected.
     * @param channel The selected channel.
     */
    onselect?: (channel: BasicChannel, toggleShow: () => void) => void;
    /**
     * The children to which the popup will be anchored.
     */
    children: Snippet;
  };

  let {
    exclude = [],
    basicChannelTypes = ["channel", "thread", "category", "voice"],
    show = $bindable(false),
    onselect = (channel) => {
      console.warn("No handler defined!", channel);
    },
    children,
    class: className = "",
  }: Props = $props();

  let search = $state("");
  let filteredChannels = $derived.by(() => {
    if (!gg.channels) return null;
    const channels = $state
      .snapshot(gg.channels)
      .filter((channel) => basicChannelTypes.some((type) => compareChannelTypes(channel.type, type)))
      .filter((channel) => channel.name.toLowerCase().includes(search.toLowerCase()));
    return sortChannels(channels.filter((channel) => !exclude.includes(channel.id)));
  });

  function toggleShow() {
    show = !show;
  }
</script>

<div class="channel-select {className}">
  {@render children()}
  {#if show}
    <div class="popup" transition:scale={{ duration: 100 }}>
      <div class="popup-inner">
        {#if !filteredChannels}
          <LoadingDots size="md" />
        {:else}
          <label class="dy-input dy-input-sm rounded-md">
            <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </g>
            </svg>
            <input type="search" placeholder="Search channel" bind:value={search} />
          </label>
          <div class="bg-base-200 border-base-200 mt-1 size-full overflow-y-auto rounded-md border-2">
            <div class="grid w-full grid-cols-1 gap-2 p-1">
              {#if filteredChannels.length > 0}
                {#each filteredChannels as channel}
                  <div class:mt-1={channel.type === ChannelType.GuildCategory} id={channel.id}>
                    <DiscordChannel
                      id={channel.id}
                      name={channel.name}
                      discordType={channel.type}
                      clickFn={() => onselect(channel, toggleShow)}
                    />
                  </div>
                {/each}
              {:else}
                <p class="dy-btn dy-btn-disabled">No channels found</p>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .channel-select {
    position: relative;
  }

  /* TODO: How to keep popup within the screen (JS...) */

  .popup {
    display: block;
    position: absolute;
    margin-top: 4px;
    left: 0;
    z-index: 1000;
    background-color: var(--color-base-300);
    border-radius: var(--radius-box);
    border: 10px solid var(--color-base-300);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    width: 300px;
    height: 400px;
    overflow: hidden;
    transition: all 100ms ease-in-out;
  }

  .popup-inner {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 4px;
    width: 100%;
    height: 100%;
    overflow-y: hidden;
    padding: 4px;
  }
</style>
