<script lang="ts">
  //   import { emojiUrl, validateEmoji } from "$lib/utils/parser";
  import * as Popover from "$ui/popover/index.js";
  import * as Select from "$ui/select/index.js";
  import * as Field from "$ui/field/index.js";
  import { ButtonStyle } from "discord-api-types/v10";
  import Smile from "@lucide/svelte/icons/smile";
  import Cog from "@lucide/svelte/icons/cog";
  import { onMount } from "svelte";
  import { cn } from "$lib/utils";
  import type { SMCustomAction } from "$lib/sm-types/src";
  import RemoveButtonWrapper from "./RemoveButtonWrapper.svelte";
  import { validateEmoji } from "$lib/utils/formatting";
  import { Button, buttonVariants } from "$ui/button";
  import Input from "$ui/input/input.svelte";

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
  }>;

  let {
    action = $bindable(),
    label = $bindable(),
    url = $bindable(),
    emoji = $bindable(),
    style = $bindable(),
    customId = $bindable(),
    onRemove = () => undefined,
  }: Props = $props();

  let emojiValid = $state(true);
  let emojiBuffer = $state(emoji);
  let buttonSettingsOpen = $state(false);

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

  const buttonStyleClasses = {
    base: "discord-btn",
    [ButtonStyle.Primary]: "discord-primary",
    [ButtonStyle.Secondary]: "discord-secondary",
    [ButtonStyle.Success]: "discord-success",
    [ButtonStyle.Danger]: "discord-danger",
    [ButtonStyle.Link]: "discord-secondary",
  };

  const buttonActionLabels = {
    link: "Link Button",
    reply: "Reply Button",
    "ticket:create": "Create Ticket Button",
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

  onMount(() => {
    if (!url && action === "link") {
      url = "https://example.com";
    }
  });
</script>

<!-- Imitate Discord's button component -->
<RemoveButtonWrapper {onRemove} class="flex-0">
  <div
    class={cn("max-w-100 truncate", buttonStyleClasses.base, buttonStyleClasses[style])}
  >
    <!-- Button Config popover -->
    <Popover.Root bind:open={buttonSettingsOpen}>
      <Popover.Trigger class={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
        {#if !!emoji && emoji.length > 0}
          {@const parsed = validateEmoji(emoji) ?? null}
          {@const emojiUrl = `https://cdn.discordapp.com/emojis/${parsed?.id ?? ""}.webp?size=96&quality=lossless`}
          {#if parsed && !parsed.id}
            <span class="size-[1.1rem]">{parsed.name}</span>
          {:else if parsed?.id}
            <img class="size-[1.1rem]" src={emojiUrl} alt="Button Emoji" />
          {:else}
            <span
              class="animate-pulse-fast size-[1.1rem]"
              {@attach () => {
                emojiValid = false;
                return () => (emojiValid = true);
              }}
            >
              ❌
            </span>
          {/if}
        {:else}
          <Cog class="size-4.5" />
        {/if}
      </Popover.Trigger>
      <Popover.Content class="flex w-xs flex-col gap-3 p-3" sideOffset={5}>
        <!-- Emoji Input -->
        <Field.Field orientation="vertical" class="gap-2">
          <Field.Label>Emoji</Field.Label>
          <Input
            type="text"
            class="w-full text-sm"
            placeholder="<:emoji_name:emoji_id> or 😀"
            bind:value={emojiBuffer}
            onblur={handleEmojiBlur}
            min="3"
            max="100"
          />
        </Field.Field>

        <Field.Group>
          <Field.Field orientation="vertical" class="gap-2">
            <Field.Label>Action</Field.Label>
            <!-- Action Selection Dropdown -->
            <Select.Root type="single" bind:value={() => action, (v) => setAction(v as SMCustomAction)}>
              <Select.Trigger class="w-full">
                Action: {buttonActionLabels[action]}
              </Select.Trigger>
              <Select.Content>
                {#each Object.keys(buttonActionLabels) as value}
                  <Select.Item {value}>
                    {buttonActionLabels[value as SMCustomAction]}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>

            <!-- Style Selection Dropdown -->
            <Select.Root
              type="single"
              bind:value={() => String(style), (v) => setStyle(parseInt(v) as Props["style"])}
            >
              <Select.Trigger class="w-full">
                Style: {buttonStyleLabels[style]}
              </Select.Trigger>
              <Select.Content>
                {#each Object.entries(buttonStyleLabels) as [value, label]}
                  <Select.Item {value}>
                    {label}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </Field.Field>

          <!-- Conditional Inputs; URL when Link; Category when Ticket Create -->
          {#if action === "link"}
            <Field.Field orientation="vertical" class="gap-0">
              <Field.Label>URL</Field.Label>
              <Input
                type="url"
                class="w-full text-sm"
                placeholder="https://example.com"
                bind:value={url}
                required
              />
            </Field.Field>
          {:else}
            <p class="text-muted-foreground text-center text-sm font-normal">
              No additional settings for this action.
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
      class="field-sizing-content min-w-20 truncate font-medium"
      maxlength="100"
      bind:value={label}
    />
  </div>
</RemoveButtonWrapper>
