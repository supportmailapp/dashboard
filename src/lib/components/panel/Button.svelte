<script lang="ts" module>
  /**
   * A custom filter function for whether each command item should match the query.
   * It should return a number between 0 and 1, with 1 being a perfect match, and 0 being no match,
   * resulting in the item being hidden entirely.
   */
  export function filterByName(
    tags: Map<string, string>,
    tagId: string,
    search: string,
    commandKeywords?: string[],
  ): number {
    const tagName = tags.get(tagId);
    if (!tagName) return 0;

    const lowerSearch = search.toLowerCase();
    const lowerTagName = tagName.toLowerCase();

    if (lowerTagName === lowerSearch) return 1;
    if (lowerTagName.includes(lowerSearch)) return 0.5;
    if (commandKeywords?.some((kw) => lowerTagName.includes(kw.toLowerCase()))) return 0.3;

    return 0;
  }

  export const buttonStyleClasses = {
    base: "discord-btn",
    [ButtonStyle.Primary]: "discord-primary",
    [ButtonStyle.Secondary]: "discord-secondary",
    [ButtonStyle.Success]: "discord-success",
    [ButtonStyle.Danger]: "discord-danger",
    [ButtonStyle.Link]: "discord-secondary",
  };
</script>

<script lang="ts">
  import * as Popover from "$ui/popover/index.js";
  import * as Select from "$ui/select/index.js";
  import * as Field from "$ui/field/index.js";
  import { ButtonStyle } from "discord-api-types/v10";
  import Cog from "@lucide/svelte/icons/cog";
  import { onMount, untrack } from "svelte";
  import { cn } from "$lib/utils";
  import type { SMCustomAction } from "$lib/sm-types/src";
  import RemoveButtonWrapper from "./RemoveButtonWrapper.svelte";
  import { Button } from "$ui/button";
  import Input from "$ui/input/input.svelte";
  import Combobox from "$ui/combobox/Combobox.svelte";
  import { getTagsManager } from "./tags.svelte";
  import LoadingSpinner from "../LoadingSpinner.svelte";
  import Emoji from "./Emoji.svelte";
  import Switch from "$ui/switch/switch.svelte";
  import { getCategoriesManager } from "./categories.svelte";
  import Trash from "@lucide/svelte/icons/trash";
  import EmojiPicker from "../EmojiPicker.svelte";

  type Props = ComponentWithRemoveHandler<{
    action: SMCustomAction;
    label: string;
    url?: string;
    emoji?: string;
    /**
     * This customId is treated as the ID of the category this button belongs to.
     *
     * When clicked on a button with a customId of a category, a ticket creation process is triggered.
     */
    customId?: string;
    style: Exclude<ButtonStyle, ButtonStyle.Premium>;
    disabled?: boolean;
  }>;

  let {
    action = $bindable(),
    label = $bindable(),
    url = $bindable(),
    emoji = $bindable(),
    style = $bindable(),
    customId = $bindable(),
    disabled = $bindable(),
    onRemove = () => undefined,
  }: Props = $props();

  const tagsManager = getTagsManager();
  const catsManager = getCategoriesManager();
  let emojiBuffer = $state(emoji);
  let buttonSettingsOpen = $state(false);
  let emojiPickerOpen = $state(false);
  let emojiPickerAnchor = $state<HTMLElement | null>(null);

  function handleEmojiBlur() {
    emoji = emojiBuffer;
  }

  const buttonStyleLabels = {
    [ButtonStyle.Primary]: "Primary",
    [ButtonStyle.Secondary]: "Secondary",
    [ButtonStyle.Success]: "Success",
    [ButtonStyle.Danger]: "Danger",
    [ButtonStyle.Link]: "Link",
  };

  const buttonActionLabels = {
    link: "Link Button",
    reply: "Reply Button",
    "ticket:create": "Start Ticket Button",
  } as const;

  function setAction(newAction: Props["action"]) {
    if (newAction === "link") {
      style = ButtonStyle.Link;
      customId = "";
      url = "https://example.com";
    } else {
      url = "";
      customId = "";
      if (style === ButtonStyle.Link) {
        style = ButtonStyle.Primary;
      }
    }
    action = newAction;
  }

  function setStyle(newStyle: Props["style"]) {
    // Update style first
    style = newStyle;

    // Handle Link style
    if (newStyle === ButtonStyle.Link) {
      customId = "";
      url = url || "https://example.com";
      action = "link";
    } else {
      // Handle non-Link styles
      url = "";
      if (action === "link") {
        action = "ticket:create";
      }
    }
  }

  function filterTags(tagId: string, search: string, commandKeywords?: string[]): number {
    return filterByName(tagsManager.tags, tagId, search, commandKeywords);
  }

  function filterTicketCategories(id: string, search: string, commandKeywords?: string[]): number {
    return filterByName(catsManager.cats, id, search, commandKeywords);
  }

  $effect(() => {
    if (buttonSettingsOpen && action === "reply" && !tagsManager.loaded) {
      untrack(() => tagsManager.fetchTags());
    }
  });

  $effect(() => {
    if (buttonSettingsOpen && action === "ticket:create" && !catsManager.loaded) {
      untrack(() => catsManager.fetchCats());
    }
  });

  onMount(() => {
    if (!url && action === "link") {
      url = "https://example.com";
    }
  });
</script>

<!-- Imitate Discord's button component -->
<RemoveButtonWrapper {onRemove} class="flex-0">
  <div
    class={cn(
      "max-w-100 truncate",
      buttonStyleClasses.base,
      buttonStyleClasses[style],
      disabled && "cursor-not-allowed opacity-50",
    )}
  >
    <!-- Button Config popover -->
    <Popover.Root bind:open={buttonSettingsOpen}>
      <Popover.Trigger
        class={cn(
          "mr-2 flex rounded-full bg-transparent p-1 transition duration-100",
          style === ButtonStyle.Link || style === ButtonStyle.Secondary
            ? "text-foreground hover:text-foreground/50"
            : "text-white hover:text-white/50",
        )}
      >
        {#if !!emoji && emoji.length > 0}
          <div class="inline-block aspect-square size-5">
            <Emoji {emoji} class="h-5" />
          </div>
        {:else}
          <Cog class="size-5" />
        {/if}
      </Popover.Trigger>
      <Popover.Content class="flex w-xs flex-col gap-3 p-3" sideOffset={5}>
        <Field.Field class="gap-2">
          <Field.Label>Emoji</Field.Label>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="outline"
              class="flex-1"
              bind:ref={emojiPickerAnchor}
              onclick={() => {
                emojiPickerOpen = true;
              }}
            >
              {#if emoji}
                <Emoji {emoji} />
              {:else}
                Pick Emoji
              {/if}
            </Button>
            {#if emoji}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onclick={() => {
                  emoji = "";
                }}
              >
                <Trash />
              </Button>
            {/if}
          </div>
        </Field.Field>

        <Field.Group>
          <Field.Field orientation="horizontal" class="grid grid-cols-3 items-center gap-2">
            <Field.Label>Action</Field.Label>
            <!-- Action Selection Dropdown -->
            <Select.Root type="single" bind:value={() => action, (v) => setAction(v as SMCustomAction)}>
              <Select.Trigger class="col-span-2 w-full">{buttonActionLabels[action]}</Select.Trigger>
              <Select.Content>
                {#each Object.keys(buttonActionLabels) as value}
                  <Select.Item {value}>
                    {buttonActionLabels[value as SMCustomAction]}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </Field.Field>

          <Field.Field orientation="horizontal" class="grid grid-cols-3 items-center gap-2">
            <Field.Label>Style</Field.Label>
            <!-- Style Selection Dropdown -->
            <Select.Root
              type="single"
              bind:value={() => String(style), (v) => setStyle(parseInt(v) as Props["style"])}
            >
              <Select.Trigger class="col-span-2 w-full">{buttonStyleLabels[style]}</Select.Trigger>
              <Select.Content>
                {#each Object.entries(buttonStyleLabels) as [value, label]}
                  <Select.Item {value}>
                    {label}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </Field.Field>

          <Field.Field orientation="horizontal" class="grid grid-cols-3 items-center gap-2">
            <Field.Label>Disabled</Field.Label>
            <div class="col-span-2 flex justify-end">
              <Switch bind:checked={() => !!disabled, (v) => (disabled = v)} />
            </div>
          </Field.Field>

          <!-- Conditional Inputs; URL when Link; Category when Ticket Create -->
          {#if action === "link"}
            <Field.Field orientation="vertical" class="gap-1">
              <Field.Label>URL</Field.Label>
              <Input
                type="url"
                class="w-full text-sm"
                placeholder="https://example.com"
                bind:value={url}
                required
              />
            </Field.Field>
          {:else if action === "reply" && tagsManager.loaded}
            <Field.Field orientation="vertical" class="gap-1">
              <Field.Label>Reply With Tag</Field.Label>
              <Combobox
                popoverTriggerClass="w-full"
                label={!customId ? "Select a reply" : (tagsManager.tags.get(customId) ?? "Unknown Tag")}
                closeOnSelect
                selected={customId ? [customId] : []}
                onSelect={(value) => (customId = value)}
                options={tagsManager.tags
                  .entries()
                  .toArray()
                  .map(([id, name]) => ({ value: id, label: name }))}
                filter={filterTags}
              />
            </Field.Field>
          {:else if action === "reply" && !tagsManager.loaded}
            <p class="text-muted-foreground text-center text-sm">
              <LoadingSpinner class="inline-block size-5" />
              Loading tags...
            </p>
          {:else if action === "ticket:create" && catsManager.cats.size > 0}
            <Field.Field orientation="vertical" class="gap-1">
              <Field.Label>Ticket Category (optional)</Field.Label>
              <div class="flex justify-between gap-1">
                <Combobox
                  popoverTriggerClass="w-full"
                  label={!customId
                    ? "Select a category"
                    : (catsManager.cats.get(customId) ?? "Unknown Category")}
                  closeOnSelect
                  selected={customId ? [customId] : []}
                  onSelect={(value) => (customId = value)}
                  options={catsManager.cats
                    .entries()
                    .toArray()
                    .map(([id, name]) => ({ value: id, label: name }))}
                  filter={filterTicketCategories}
                />
                <Button
                  variant="outline"
                  size="icon"
                  class={customId ? "text-destructive" : "hidden"}
                  onclick={() => (customId = "")}
                  aria-label="Clear Category"
                >
                  <Trash />
                </Button>
              </div>
            </Field.Field>
          {:else if action === "ticket:create" && catsManager.cats.size === 0 && catsManager.loaded}
            <p class="text-muted-foreground text-center text-sm">No ticket categories available.</p>
          {:else if action === "ticket:create" && !catsManager.loaded}
            <p class="text-muted-foreground text-center text-sm">
              <LoadingSpinner class="inline-block size-5" />
              Loading categories...
            </p>
          {/if}
        </Field.Group>
        <Button
          class="w-full"
          variant="secondary"
          size="sm"
          onclick={() => {
            buttonSettingsOpen = false;
          }}
        >
          Save
        </Button>
      </Popover.Content>
    </Popover.Root>

    <input
      type="text"
      aria-label="Button label"
      class={cn(
        "field-sizing-content min-w-20 truncate font-medium",
        style === ButtonStyle.Link ? "text-black dark:text-white" : "text-white",
      )}
      maxlength="100"
      bind:value={label}
    />
  </div>
</RemoveButtonWrapper>

{#if emojiPickerAnchor}
  <EmojiPicker
    anchor={emojiPickerAnchor}
    bind:open={emojiPickerOpen}
    onPick={(data) => {
      if (data.custom) {
        emoji = `<${data.emoji.animated ? "a" : ""}:${data.emoji.name}:${data.emoji.id}>`;
      } else {
        emoji = data.emoji.name || "";
      }
      emojiPickerOpen = false;
    }}
  />
{/if}
