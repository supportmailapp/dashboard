<script lang="ts">
  import * as dismoji from "discord-emoji";
  import DCEmoji from "./DiscordEmoji.svelte";
  import { gg } from "$lib/stores/guild.svelte";
  import { Search, Sparkle } from "@lucide/svelte";

  let { emoji = $bindable<string | null>(null) } = $props();

  // A list of emojis categories
  let categories = $state([
    {
      name: gg.guild?.name,
      icon: gg.guild?.icon,
      collapsed: false,
    },
    {},
  ]);
</script>

<div class="emoji-selector">
  <div class="header">
    <form class="dy-input dy-input-xs dy-input-accent max-w-[250px]">
      <input type="text" placeholder="Search Emoji" />
      <button>
        <Search size="16" />
      </button>
    </form>
    <div class="buttons">
      <button class="dy-btn dy-btn-neutral h-full">
        <Sparkle size="16" />
      </button>
      <button class="dy-btn dy-btn-neutral h-full">
        {dismoji.people.wave}
      </button>
    </div>
  </div>

  <div class="sidebar">
    <DCEmoji id="1312118778439405649" name="smArrow" />
    <DCEmoji id="1312118778439405649" name="smArrow" />
    <DCEmoji id="1312118778439405649" name="smArrow" />
  </div>

  <div class="content">
    <DCEmoji id="1312118778439405649" name="smArrow" />
    <DCEmoji id="1312118778439405649" name="smArrow" />
    <DCEmoji id="1312118778439405649" name="smArrow" />
  </div>

  <div class="footer">
    <DCEmoji id="1312118778439405649" name="smArrow" />
    <DCEmoji id="1312118778439405649" name="smArrow" />
    <DCEmoji id="1312118778439405649" name="smArrow" />
  </div>
</div>

<style>
  :root {
    --selector-width: 350px;
    --selector-height: 300px;
    --selector-border-radius: 0.5rem;
  }

  .emoji-selector {
    display: grid;
    grid-template-areas:
      "header header"
      "sidebar content"
      "sidebar footer";
    grid-template-columns: auto 1fr;
    grid-template-rows: auto 1fr auto;
    width: var(--selector-width);
    height: var(--selector-height);
    overflow: visible;
    background-color: var(--color-base-100);
    border-radius: var(--selector-border-radius);
    box-shadow: 0 0 5px rgba(80, 80, 80, 0.336);
  }

  .header {
    grid-area: header;
    padding: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    height: 40px;
  }

  .buttons {
    flex-grow: 1;
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    gap: 0.25rem;
  }

  .sidebar {
    grid-area: sidebar;
    background-color: #ffcc00; /* Yellow */
    width: 2.75rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
    justify-content: start;
    align-items: center;
  }

  .content {
    grid-area: content;
    background-color: #4a69bd; /* Blue */
    overflow-y: auto;
  }

  .footer {
    grid-area: footer;
    background-color: #c0392b; /* Red */
    padding: 2.5px;
  }
</style>
