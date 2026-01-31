<script lang="ts">
  import { componentDefaults, componentOptions } from "$lib";
  import type { SMContainerComponent } from "$lib/sm-types";
  import { hexToNumber, numberToHex } from "$lib/utils/formatting";
  import Paintbrush from "@lucide/svelte/icons/paintbrush";
  import Eye from "@lucide/svelte/icons/eye";
  import EyeOff from "@lucide/svelte/icons/eye-off";
  import { ComponentType } from "discord-api-types/v10";
  import * as DropdownMenu from "$ui/dropdown-menu/index.js";
  import * as Popover from "$ui/popover/index.js";
  import Plus from "@lucide/svelte/icons/plus";
  import Section from "./Section.svelte";
  import Separator from "./Separator.svelte";
  import TextDisplay from "./TextDisplay.svelte";
  import { cn } from "$lib/utils";
  import { buttonVariants } from "$ui/button";
  import Button from "$ui/button/button.svelte";
  import RemoveButtonWrapper from "./RemoveButtonWrapper.svelte";
  import Input from "$ui/input/input.svelte";
  import ComponentTypeIcon from "./ComponentTypeIcon.svelte";
  import MediaGallery from "./MediaGallery.svelte";
  import ActionRow from "./ActionRow.svelte";

  type Props = Omit<SMContainerComponent, "type"> &
    ComponentWithRemoveHandler & {
      totalComponents: number;
    };

  let {
    components = $bindable([]),
    accent_color = $bindable<number | undefined>(undefined),
    spoiler = $bindable(false),
    onRemove,
    totalComponents,
  }: Props = $props();

  // Filter out Container from options since containers can't contain containers
  const availableOptions = componentOptions.filter((option) => option.type !== ComponentType.Container);

  let selectorOpen = $state(false);

  function addComponent(type: keyof typeof componentDefaults) {
    components = [...components, { type, ...componentDefaults[type] } as any];
    selectorOpen = false;
  }
</script>

<!-- Basically like a discord embed with the accent color -->
<RemoveButtonWrapper {onRemove}>
  <div
    class={cn(
      "container-component space-y-1 rounded border px-2 py-1 transition duration-200 ease-in-out",
      spoiler && "bg-linear-to-br from-violet-500/20 to-blue-500/20",
    )}
    style="--accentColor: {accent_color ? `#${numberToHex(accent_color)}` : 'transparent'};"
  >
    {#each components as component, index (index)}
      {#if component.type === ComponentType.TextDisplay}
        <TextDisplay
          bind:content={component.content}
          onRemove={() => (components = components.filter((_, i) => i !== index))}
        />
      {:else if component.type === ComponentType.Separator}
        <Separator
          bind:divider={component.divider}
          bind:spacing={component.spacing}
          onRemove={() => (components = components.filter((_, i) => i !== index))}
        />
      {:else if component.type === ComponentType.ActionRow}
        <ActionRow
          bind:components={component.components}
          onRemove={() => (components = components.filter((_, i) => i !== index))}
          {totalComponents}
        />
      {:else if component.type === ComponentType.MediaGallery}
        <MediaGallery
          bind:items={component.items}
          onRemove={() => (components = components.filter((_, i) => i !== index))}
          {totalComponents}
        />
      {:else if component.type === ComponentType.Section}
        <Section
          bind:components={component.components}
          bind:accessory={component.accessory}
          onRemove={() => (components = components.filter((_, i) => i !== index))}
          {totalComponents}
        />
      {/if}
    {/each}

    <div class="flex w-full not-first:mt-3">
      <DropdownMenu.Root bind:open={selectorOpen}>
        <DropdownMenu.Trigger
          disabled={totalComponents >= 40}
          class={buttonVariants({ variant: "outline", size: "sm", class: "mx-auto w-fit" })}
        >
          <Plus />
          {totalComponents < 40 ? "Component" : "Component Limit Reached"}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Group>
            {#each availableOptions as option (option.type)}
              <DropdownMenu.Item onSelect={() => addComponent(option.type)}>
                <ComponentTypeIcon type={option.type} />
                {option.label}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>

    <div class="mt-3 flex flex-row justify-center gap-2">
      <!-- Popover for setting accent color -->
      <Popover.Root>
        <Popover.Trigger
          class={buttonVariants({ variant: "outline", size: "icon-sm" })}
          aria-label="Set Accent Color"
        >
          <Paintbrush class="size-4" />
        </Popover.Trigger>
        <Popover.Content class="mt-1 flex flex-col" align="start" side="bottom" sideOffset={4}>
          <Input
            type="color"
            class="h-10 w-full cursor-pointer rounded border-0 p-0"
            value={typeof accent_color === "number" ? numberToHex(accent_color, true) : "#000000"}
            onchange={(e) => {
              accent_color = hexToNumber(e.currentTarget.value.replace("#", ""));
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            onclick={() => (accent_color = undefined)}
            aria-label="Clear accent color"
          >
            Clear
          </Button>
        </Popover.Content>
      </Popover.Root>
      <!-- Button for toggling spoiler -->
      <Button
        variant="outline"
        size="icon-sm"
        onclick={() => (spoiler = !spoiler)}
        aria-label="Toggle Spoiler"
      >
        {#if !spoiler}
          <Eye class="size-4" />
        {:else}
          <EyeOff class="size-4" />
        {/if}
      </Button>
    </div>
  </div>
</RemoveButtonWrapper>

<style>
  .container-component {
    position: relative;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      border-top-left-radius: 0.5rem;
      border-bottom-left-radius: 0.5rem;
      background-color: var(--accentColor, transparent);
    }
  }
</style>
