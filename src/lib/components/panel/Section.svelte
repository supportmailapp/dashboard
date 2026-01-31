<script lang="ts">
  import type { SMActionRowButton, SMSectionComponent } from "$lib/sm-types/src";
  import { ButtonStyle, ComponentType } from "discord-api-types/v10";
  import RemoveButtonWrapper from "./RemoveButtonWrapper.svelte";
  import TextDisplay from "./TextDisplay.svelte";
  import Button from "./Button.svelte";
  import { buttonVariants, Button as UIButton } from "$ui/button";
  import * as DropdownMenu from "$ui/dropdown-menu/index.js";
  import Plus from "@lucide/svelte/icons/plus";
  import MediaItem from "./MediaItem.svelte";

  type Props = ComponentWithRemoveHandler<Omit<SMSectionComponent, "type">> & {
    totalComponents: number;
  };

  let { components = $bindable([]), accessory = $bindable(), onRemove }: Props = $props();

  function addTextDisplay() {
    if (components.length >= 3) return;
    components = [...components, { type: ComponentType.TextDisplay, content: "" }];
  }

  function setAccessory(type: ComponentType.Button | ComponentType.Thumbnail) {
    if (type === ComponentType.Button) {
      accessory = {
        type,
        action: "reply",
        style: ButtonStyle.Primary,
        label: "New Button",
        custom_id: "",
        emoji: undefined,
      };
    } else {
      accessory = {
        type,
        url: "",
        description: "",
        spoiler: false,
      };
    }
  }
</script>

<RemoveButtonWrapper {onRemove}>
  <div class="flex w-full flex-col gap-2 rounded border p-2 sm:flex-row">
    <div class="flex flex-1 flex-col gap-2">
      {#each components as td, index (index)}
        <TextDisplay
          bind:content={td.content}
          onRemove={() => (components = components.filter((_, i) => i !== index))}
        />
      {/each}
      {#if components.length < 3}
        <UIButton variant="outline" size="sm" class="mx-auto w-fit" onclick={addTextDisplay}>
          <Plus />
          Text Display
        </UIButton>
      {/if}
    </div>
    <div>
      {#if accessory?.type === ComponentType.Thumbnail}
        <MediaItem
          inGallery
          bind:url={accessory.url}
          bind:description={accessory.description}
          bind:spoiler={accessory.spoiler}
          onRemove={() => (accessory = undefined)}
        />
      {:else if accessory?.type === ComponentType.Button}
        <!-- Typescript goes nuts with variables in getters/setters which is why we have to overdo it with the typechecking -->
        <Button
          bind:action={accessory.action}
          bind:label={
            () => (accessory as SMActionRowButton).label || "",
            (v) => ((accessory as SMActionRowButton).label = v)
          }
          bind:url={
            () =>
              accessory?.type === ComponentType.Button && accessory.style === 5 ? accessory.url : undefined,
            (v) => {
              if (accessory?.type === ComponentType.Button && accessory.style === 5) {
                accessory.url = v || "";
              }
            }
          }
          bind:emoji={accessory.emoji}
          bind:style={accessory.style}
          bind:customId={
            () =>
              accessory?.type === ComponentType.Button && accessory.style !== 5
                ? accessory.custom_id
                : undefined,
            (v) => {
              if (accessory?.type === ComponentType.Button && accessory.style !== 5) {
                accessory.custom_id = v || "";
              }
            }
          }
          onRemove={() => (accessory = undefined)}
        />
      {:else}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger class={buttonVariants({ variant: "outline", size: "sm" })}>
            <Plus />
            Accessory
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item onclick={() => setAccessory(ComponentType.Button)}>Button</DropdownMenu.Item>
            <DropdownMenu.Item onclick={() => setAccessory(ComponentType.Thumbnail)}>
              Thumbnail
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    </div>
  </div>
</RemoveButtonWrapper>
