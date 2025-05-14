<script lang="ts">
  import type { APIPartialEmoji } from "discord.js";
  import twemoji from "twemoji";
  import { onMount } from "svelte";

  import { activity, people, flags, nature, objects, symbols, food, travel } from "$lib/emojis";
  import { gg, loadGuildEmojis } from "$lib/stores/guild.svelte";
  import { Search } from "@lucide/svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { allEmojiGroups, getEmojiGroupById } from "$lib/emojis";

  const defaultEmojiCategories = {
    activity,
    people,
    flags,
    nature,
    objects,
    symbols,
    food,
    travel,
  } as const;

  let {
    onclick = $bindable<(emoji: APIPartialEmoji) => void>(() => {
      console.warn("No handler set!");
    }),
  } = $props();

  // A list of emojis categories
  let categories = $derived([
    {
      id: 0,
      name: gg.guild?.name,
      collapsed: false,
      svg: `<img src=${cdnUrls.guildIcon(gg.guild?.id ?? "", gg.guild?.icon ?? "", 64)} class=""/>`,
    },
    ...allEmojiGroups,
  ]);
  let selectedCategory = $state<{ id: number; name: string }>({
    id: 0,
    name: gg.guild?.name || "",
  });
  let emojiInputStyle = $state<"default" | "custom">("default");

  function selectCategory(_i: number, name: string) {
    selectedCategory.id = _i;
    selectedCategory.name = name;
  }

  function toggleEmojiInputStyle() {
    emojiInputStyle = emojiInputStyle === "default" ? "custom" : "default";
  }

  onMount(async () => {
    if (!gg.emojis.length) await loadGuildEmojis();
  });
</script>

<!-- TODO
- Add render when scrolled in viewport
- Refactor to only use a single content div and have sectioned content for each emoji group
- Add search functionality
-->

<div class="emoji-selector">
  <div class="header">
    <form class="dy-input dy-input-xs max-w-[250px]">
      <input type="text" placeholder="Search Emoji" />
      <button>
        <Search size="16" />
      </button>
    </form>
    <div class="buttons">
      <button class="dy-btn dy-btn-neutral h-full" onclick={toggleEmojiInputStyle}>
        {#if emojiInputStyle === "default"}
          {nature.sparkles}
        {:else}
          {people.smile}
        {/if}
      </button>
      <button class="dy-btn dy-btn-neutral h-full">
        {people.wave}
      </button>
    </div>
  </div>
  <div class="wrapper">
    <div class="content {emojiInputStyle === 'custom' ? 'custom-emoji' : 'default'}">
      {#if emojiInputStyle === "custom"}
        <div style="padding: 5px; width: 100%; height: 100%;">
          <fieldset class="dy-fieldset border-base-300 h-full w-full rounded border-1 p-2 select-none">
            <legend class="dy-fieldset-legend">Use Custom Emoji</legend>
            <p class="text-warning text-xs font-semibold">The bot has to be on the server to use it!</p>
            <input
              type="text"
              minlength="1"
              maxlength="32"
              class="dy-input h-8 max-w-full text-xs"
              placeholder="Emoji Name"
              required
            />
            <input
              type="text"
              minlength="18"
              maxlength="24"
              class="dy-input h-8 max-w-full text-xs"
              placeholder="Emoji ID"
              required
            />
            <label class="dy-label my-2">
              <input type="checkbox" class="dy-checkbox dy-checkbox-sm" placeholder="Emoji Name" />
              Animated
            </label>
            <button class="dy-btn dy-btn-primary dy-btn-sm w-full">Save</button>
          </fieldset>
        </div>
      {:else if selectedCategory.id > 0 && selectedCategory.name}
        <!-- Default Emojis -->
        {#each Object.entries(getEmojiGroupById(selectedCategory.id)) as emojiData}
          <button class="emoji-btn" onclick={() => onclick({ name: emojiData[0], animated: false })}>
            <!-- svelte-ignore a11y_missing_attribute -->
            <img src={`/emojis/${twemoji.convert.toCodePoint(emojiData[1])}.svg`} alt={emojiData[0]} />
          </button>
        {/each}
      {:else if selectedCategory.id === 0}
        <!-- Guild Emojis -->
        {#each gg.emojis as emoji}
          <button
            class="emoji-btn"
            onclick={() => onclick({ id: emoji.id, name: emoji.name, animated: !!emoji.animated })}
          >
            <img src={cdnUrls.guildEmoji(emoji.id!, 64)} alt="Guild Emoji" />
          </button>
        {/each}
      {/if}
    </div>
  </div>

  <div class="bottom">
    {#each categories as category}
      <button
        class:active={selectedCategory.id === category.id}
        onclick={() => selectCategory(category.id, category.name!)}
      >
        {@html category.svg}
      </button>
    {/each}
  </div>
</div>

<style>
  :root {
    --selector-width: 335px;
    --selector-height: 320px;
    --selector-border-radius: 0.5rem;
  }

  .emoji-selector {
    --btn-active-color: color-mix(in oklab, var(--color-base-content) 25%, transparent);
    display: flex;
    flex-direction: column;
    width: var(--selector-width);
    height: var(--selector-height);
    overflow: clip;
    background-color: var(--color-base-200);
    border-radius: var(--selector-border-radius);
    box-shadow: 0 0 5px rgba(80, 80, 80, 0.336);
  }

  .header {
    padding: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    height: 40px;
    border-bottom: 1px solid var(--color-base-300);
    border-top-left-radius: 1.5rem;
    border-top-right-radius: 1.5rem;
    box-shadow: 0 0 5px rgba(30, 30, 30, 0.6);
  }

  .buttons {
    flex-grow: 1;
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    gap: 0.25rem;
  }

  .wrapper {
    flex: 1;
  }

  .content {
    overflow-y: auto;
    display: grid;
    flex: 1;
    padding-inline: 0.5rem;
    margin-block: 0;
    padding: 5px;
    place-items: center;
    height: fit-content;
    gap: 2px;
    max-height: calc(var(--selector-height) - 80px);

    &.custom-emoji {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
    }

    &.default {
      grid-template-columns: repeat(10, minmax(0, 1fr));
    }

    .emoji-btn {
      width: 33px;
      height: 33px;
      aspect-ratio: 1 / 1;
      padding: 3px;
      border-radius: 0.5rem;

      &:hover,
      &:active {
        background-color: var(--btn-active-color);
      }
    }
  }

  .bottom {
    height: 40px;
    background-color: var(--color-base-300);
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 2px;

    button {
      height: 34px;
      width: 34px;
      aspect-ratio: 1 / 1;
      padding: 3px;
      border-radius: 0.3rem;
      background-color: transparent;
      border: none;
      cursor: pointer;
      transition-property: all;
      transition-duration: 100ms;
      transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
      display: flex;
      justify-content: center;
      align-items: center;

      &:active {
        transform: translateY(1px);
      }

      &.active,
      &:hover {
        background-color: var(--btn-active-color);
      }
    }
  }
</style>
