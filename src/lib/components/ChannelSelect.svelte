<script lang="ts">
  import { gg } from "$lib/stores/guild.svelte";
  import { scale } from "svelte/transition";
  import { type Snippet } from "svelte";
  import DiscordChannel from "./DiscordChannel.svelte";
  import LoadingDots from "./LoadingDots.svelte";

  type Props = {
    /**
     * An array of role IDs to exclude from the selection.
     */
    exclude?: string[];
    /**
     * Whether to exclude managed roles from the list.
     */
    managedRolesBehavior?: "exclude" | "include" | "no-select";
    /**
     * Whether to exclude the `@everyone` role from the list.
     */
    excludeAtEveryone?: boolean;
    show: boolean;
    /**
     * The text to display in the dialog. If not provided, no text will be shown.
     */
    text?: string;
    /**
     * Callback function to be called when a role is selected.
     * @param channel The selected role.
     */
    onselect?: (channel: BasicChannel) => void;
    /**
     * The children to which the popup will be anchored.
     */
    children: Snippet;
  };

  // TODO: Find a way to make this work with

  let {
    exclude = [],
    show = $bindable(false),
    onselect = (_) => {
      console.warn("No handler defined!");
      show = false;
    },
    children,
  }: Props = $props();

  let popupElement = $state<HTMLDivElement>();

  let search = $state("");
  let filteredChannels = $derived.by(() => {
    return gg.channels?.filter((channel) => channel.name.toLowerCase().includes(search.toLowerCase())) ?? null;
  });
</script>

<div class="channel-select">
  {@render children()}
  {#if show}
    <div class="popup" transition:scale={{ duration: 100 }} bind:this={popupElement}>
      {#if !filteredChannels}
        <LoadingDots size="md" />
      {:else}
        <label class="dy-input">
          <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </g>
          </svg>
          <input type="search" placeholder="Search channel" bind:value={search} />
        </label>
        <div class="size-full overflow-y-auto">
          {#if filteredChannels.length > 0}
            {#each filteredChannels as channel}
              <button onclick={() => onselect(channel)}>
                <DiscordChannel id={channel.id} name={channel.name} discordType={channel.type} />
              </button>
            {/each}
          {:else}
            <p class="dy-btn dy-btn-disabled">No channels found</p>
          {/if}
        </div>
      {/if}
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
    top: 0;
    left: 0;
    z-index: 1000;
    background-color: var(--color-base-200);
    border-radius: var(--radius-box);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    padding: 8px;
    width: 300px;
    height: 400px;
    overflow: hidden;
    transition: all 100ms ease-in-out;
    gap: 4px;
  }
</style>
