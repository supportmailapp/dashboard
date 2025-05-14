<script lang="ts">
  import { scale } from "svelte/transition";
  import { type Snippet } from "svelte";
  import DiscordChannel from "./DiscordChannel.svelte";
  import LoadingDots from "./LoadingDots.svelte";
  import { ChannelType } from "discord-api-types/v10";
  import type { ClassValue } from "svelte/elements";
  import { getCachedUser, setCachedUser } from "$lib/stores/users.svelte";
  import ky from "ky";
  import { APIRoutes } from "$lib/urls";
  import { page } from "$app/state";
  import { gg } from "$lib/stores/guild.svelte";
  import { BASIC_GET_FETCH_INIT } from "$lib/constants";

  type BasicChannelType = "channel" | "thread" | "category" | "voice";

  type Props = {
    /**
     * An array of user IDs to exclude from the selection.
     */
    exclude?: string[];
    show: boolean;
    /**
     * Indicates whether the search is loading.
     */
    loading?: boolean;
    /**
     * The text to display in the dialog. If not provided, no text will be shown.
     */
    text?: string;
    class?: ClassValue;
    /**
     * Callback function to be called when a user is selected.
     * @param user The selected user.
     */
    onselect?: (user: BasicUser) => void;
    /**
     * The children to which the popup will be anchored.
     */
    children: Snippet;
  };

  let {
    exclude = [],
    show = $bindable(false),
    loading = $bindable(false),
    onselect = (user) => {
      console.warn("No handler defined!", user);
    },
    children,
    class: className = "",
  }: Props = $props();

  let search = $state("");
  let filteredUsers = $state<BasicUser[]>();

  async function searchUsers() {
    if (/^\d+$/.test(search)) {
      let user = getCachedUser(search);
      if (user) {
        return [user];
      }
    }
    if (!gg.guild) return [];
    const res = await ky.get(APIRoutes.searchGuildMembers(gg.guild.id), {
      ...BASIC_GET_FETCH_INIT,
      searchParams: {
        query: search,
      },
    });
    if (res.ok) {
      const data = await res.json<BasicUser[]>();
      filteredUsers = data;
      data.forEach(setCachedUser);
    }
  }

  function toggleShow() {
    show = !show;
  }
</script>

<div class="channel-select {className}">
  {@render children()}
  {#if show}
    <div class="popup" transition:scale={{ duration: 100 }}>
      <div class="popup-inner">
        {#if !filteredUsers}
          <LoadingDots size="md" />
        {:else}
          <label class="dy-input dy-input-sm rounded-md">
            <input type="search" placeholder="Search user" bind:value={search} />
            <button class="bg-base-100/40 hover:bg-base-100 rounded-box" aria-label="Search">
              <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </g>
              </svg>
            </button>
          </label>
          <div class="bg-base-200 border-base-200 mt-1 size-full overflow-y-auto rounded-md border-2">
            <div class="grid w-full grid-cols-1 gap-2 p-1">
              {#if filteredUsers.length > 0}
                {#each filteredUsers as channel}
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
