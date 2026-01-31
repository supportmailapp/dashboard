<script lang="ts">
  import { componentDefaults, componentOptions } from "$lib";
  import type { IPanel, SMComponentInContainer, SMTopLevelMessageComponent } from "$lib/sm-types/src";
  import { buttonVariants } from "$ui/button";
  import * as DropdownMenu from "$ui/dropdown-menu/index.js";
  import Plus from "@lucide/svelte/icons/plus";
  import { ComponentType } from "discord-api-types/v10";
  import TextDisplay from "./TextDisplay.svelte";
  import Separator from "./Separator.svelte";
  import Container from "./Container.svelte";
  import ComponentTypeIcon from "./ComponentTypeIcon.svelte";
  import ActionRow from "./ActionRow.svelte";
  import { setTagsManager } from "./tags.svelte";
  import MediaGallery from "./MediaGallery.svelte";
  import Section from "./Section.svelte";

  let {
    components = $bindable([]),
    totalComponents = 0,
  }: {
    components: SMTopLevelMessageComponent[];
    totalComponents?: number;
  } = $props();

  setTagsManager();
  let selectorOpen = $state(false);
  function addComponent(type: keyof typeof componentDefaults) {
    components = [...components, { type, ...componentDefaults[type] } as any];
    selectorOpen = false;
  }

  /**
   * Calculates the total number of components, counting nested components within ActionRows and all other components.
   */
  function calculateComponentCount(componentList: IPanel["data"] | SMComponentInContainer[]): number {
    let count = 0;
    for (const component of componentList) {
      count += 1; // Count the component itself
      switch (component.type) {
        case ComponentType.ActionRow: // ActionRows can only contain buttons
          count += component.components.length;
          break;
        case ComponentType.Container: // Containers can contain any component type, except Containers
          count += calculateComponentCount(component.components);
          break;
        case ComponentType.Section: // Sections can contain text displays (.components) and an accessory.
          // The accessory counts as one component and usually must be provided.
          if (component.accessory) count += 1;
          count += component.components.length;
          break;
        case ComponentType.MediaGallery: // MediaGallery contains media items (.items)
          count += component.items.length;
          break;
        case ComponentType.TextDisplay: // TextDisplays count as one component
        case ComponentType.Separator: // Separators count as one component
        default:
          break;
      }
    }
    return count;
  }

  $effect(() => {
    totalComponents = calculateComponentCount(components);
  });
</script>

<div class="flex flex-col gap-1 rounded bg-[#1e2124] p-2">
  {#each components as component, index}
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
    {:else if component.type === ComponentType.Container}
      <Container
        bind:components={component.components}
        bind:accent_color={component.accent_color}
        bind:spoiler={() => !!component.spoiler, (v) => (component.spoiler = v)}
        onRemove={() => (components = components.filter((_, i) => i !== index))}
        {totalComponents}
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
        {#each componentOptions as option (option.type)}
          <DropdownMenu.Item onSelect={() => addComponent(option.type)}>
            <ComponentTypeIcon type={option.type} />
            {option.label}
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
  {#if totalComponents >= 40}
    <p class="text-error text-sm">You have reached the maximum of 40 components.</p>
  {/if}
</div>
