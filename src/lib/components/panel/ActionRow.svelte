<script lang="ts">
  import type { SMActionRowButton, SMComponentInActionRow, SMSelect } from "$lib/sm-types/src";
  import { ButtonStyle, ComponentType } from "discord-api-types/v10";
  import RemoveButtonWrapper from "./RemoveButtonWrapper.svelte";
  import Button from "./Button.svelte";
  import { Button as UIButton } from "$ui/button";
  import Plus from "@lucide/svelte/icons/plus";
  import { toast } from "svelte-sonner";
  import SelectMenu from "./SelectMenu.svelte";

  type Props = ComponentWithRemoveHandler<{
    components: SMComponentInActionRow[];
    totalComponents: number;
  }>;
  let { components = $bindable([]), totalComponents, onRemove }: Props = $props();

  function addButton() {
    if (components.length >= 5) {
      toast.error("You can only have up to 5 buttons in an action row.");
      return;
    }
    components = [
      ...components,
      {
        action: "reply",
        type: ComponentType.Button,
        style: ButtonStyle.Primary,
        label: "New Button",
        custom_id: "",
        emoji: undefined,
      },
    ];
  }

  function addSelect() {
    if (totalComponents >= 40) {
      toast.error("You have reached the maximum number of components allowed.");
      return;
    }
    components = [
      ...components,
      {
        type: ComponentType.StringSelect,
        custom_id: "panelSelect",
        options: [],
        placeholder: "Select an option",
      },
    ];
  }
</script>

<RemoveButtonWrapper {onRemove}>
  <div
    class="flex w-full max-w-full flex-1 flex-row flex-wrap items-center gap-2 overflow-x-hidden rounded border p-2 *:max-w-full"
  >
    {#each components as component, index (index)}
      {#if component.type === ComponentType.Button}
        <Button
          bind:action={component.action}
          bind:label={() => component.label || "", (v) => (component.label = v)}
          bind:url={
            () => (component.style === 5 ? component.url : undefined),
            (v) => {
              if (component.style === 5) component.url = v || "";
            }
          }
          bind:emoji={component.emoji}
          bind:style={component.style}
          bind:customId={
            () => (component.style !== 5 ? component.custom_id : undefined),
            (v) => {
              if (component.style !== 5) component.custom_id = v || "";
            }
          }
          bind:disabled={() => !!(component as SMActionRowButton).disabled, (v) => (component.disabled = v)}
          onRemove={() => (components = components.filter((_, i) => i !== index))}
        />
      {:else}
        <SelectMenu
          bind:options={component.options}
          bind:placeholder={
            () => (components[index] as SMSelect).placeholder || "",
            (v) => ((components[index] as SMSelect).placeholder = v)
          }
          onRemove={() => (components = components.filter((_, i) => i !== index))}
        />
      {/if}
    {/each}
    {#if components.length < 5 && totalComponents < 40 && components[0]?.type !== ComponentType.StringSelect}
      <UIButton variant="outline" size="sm" class="shrink-0" onclick={addButton}>
        <Plus />
        Button
      </UIButton>
    {/if}
    {#if components.length === 0 && totalComponents < 40}
      <UIButton variant="outline" size="sm" class="shrink-0" onclick={addSelect}>
        <Plus />
        Select Menu
      </UIButton>
    {/if}
  </div>
</RemoveButtonWrapper>
