<script lang="ts">
  import * as Popover from "$ui/popover/index";
  import * as Command from "$ui/command/index";
  import * as Tabs from "$ui/tabs/index";
  import { onMount } from "svelte";
  import { SvelteMap } from "svelte/reactivity";
  import apiClient from "$lib/utils/apiClient";
  import { APIRoutes, DocsLinks } from "$lib/urls";
  import { page } from "$app/state";
  import Input from "$ui/input/input.svelte";
  import LoadingSpinner from "./LoadingSpinner.svelte";
  import { filterByName } from "./panel/Button.svelte";
  import Button from "$ui/button/button.svelte";
  import { cn } from "$lib/utils";
  import { validateEmoji } from "$lib/utils/formatting";
  import type { IPartialEmoji } from "$lib/sm-types/src";
  import Emoji from "./panel/Emoji.svelte";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";

  type EmojiPickCallbackData = { emoji: IPartialEmoji; custom: boolean };

  let {
    anchor,
    onPick,
    open = $bindable(false),
  }: {
    anchor: HTMLElement;
    allowCustom?: boolean;
    onPick?: (data: EmojiPickCallbackData) => void;
    open: boolean;
  } = $props();

  let activeTab = $state<"server" | "other">("server");
  /**
   * A map of emoji id to emoji data
   */
  const emojis = new SvelteMap<string, APICustomEmoji>();
  let emojisMap = $derived(
    emojis.values().reduce((map, emoji) => {
      map.set(emoji.id, emoji.name);
      return map;
    }, new Map<string, string>()),
  );
  let loaded = $state(false);
  let lastHoveredEmojiName = $state<string | null>(null);
  let standardInputValue = $state("");
  let standardEmojiData = $derived(validateEmoji(standardInputValue || ""));

  onMount(async function () {
    const res = await apiClient.get<APICustomEmoji[]>(APIRoutes.listGuildEmojis("1114825999155200101"));
    if (res.ok) {
      const data = await res.json();
      for (const emoji of data) {
        emojis.set(emoji.id, emoji);
      }
    } else {
      console.error("Failed to fetch emojis:", res.statusText);
    }
    loaded = true;
  });
</script>

<Popover.Root
  bind:open
  onOpenChangeComplete={() => {
    lastHoveredEmojiName = null;
    standardInputValue = "";
  }}
>
  <Popover.Content customAnchor={anchor} class="max-w-72 p-1">
    <Tabs.Root bind:value={activeTab}>
      <Tabs.List class="w-full rounded-sm">
        <Tabs.Trigger value="server">Server</Tabs.Trigger>
        <Tabs.Trigger value="other">Other</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="server">
        {#if !loaded}
          <div class="col-span-full flex justify-center p-4">
            <LoadingSpinner size="12" />
          </div>
        {:else}
          <Command.Root filter={(a, b, c) => filterByName(emojisMap, a, b, c)}>
            <Command.Input placeholder="Search your server's emojis..." />
            <Command.List class="max-h-80 overflow-y-auto">
              <Command.Empty>No emojis found</Command.Empty>
              <Command.Group>
                <div class="flex flex-wrap gap-0.5 p-2">
                  {#each emojis.values() as emoji}
                    <Command.Item
                      value={emoji.id}
                      class="flex cursor-pointer flex-col items-center p-1 hover:bg-gray-200/10"
                      onSelect={() => {
                        onPick?.({ emoji, custom: true });
                        open = false;
                      }}
                      onmouseover={() => {
                        lastHoveredEmojiName = emoji.name;
                      }}
                    >
                      <div class="flex aspect-square size-8 justify-center overflow-hidden">
                        <img
                          src={`https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? "gif" : "webp"}?size=64&quality=lossless`}
                          alt={emoji.name}
                          class="h-8 object-contain"
                        />
                      </div>
                    </Command.Item>
                  {/each}
                </div>
              </Command.Group>
            </Command.List>
          </Command.Root>
        {/if}
      </Tabs.Content>
      <Tabs.Content value="other" class="overflow-hidden">
        <p class="text-secondary px-2 text-sm select-none">
          Enter a custom emoji in <a href={DocsLinks.EmojiMarkdownFormat} target="_blank" class="link">
            emoji markdown format
          </a> or standard unicode emoji like 🔥, ✅ or 🧙‍♂️
        </p>

        {#if standardEmojiData}
          <p class="flex justify-center select-none">
            <Emoji class="flex size-10 align-middle" data={standardEmojiData} />
          </p>
        {/if}

        <Input bind:value={standardInputValue} class="mt-2 rounded-b-none" placeholder="Standard emoji" />
        <Button variant="secondary" class="w-full rounded-t-none" disabled={!standardEmojiData}>Use</Button>
      </Tabs.Content>
    </Tabs.Root>
    {#if activeTab === "server"}
      <p class="dark:bg-input/30 mt-2 h-7 w-full rounded-sm border bg-transparent px-1.5 py-1 text-sm">
        {lastHoveredEmojiName ?? ""}
      </p>
    {/if}
  </Popover.Content>
</Popover.Root>
