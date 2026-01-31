<script lang="ts">
  import type { SMComponentInActionRow } from "$lib/sm-types/src";
  import { ComponentType } from "discord-api-types/v10";
  import RemoveButtonWrapper from "./RemoveButtonWrapper.svelte";
  import Button from "./Button.svelte";
  import { Button as UIButton } from "$ui/button";
  import Plus from "@lucide/svelte/icons/plus";
  import { toast } from "svelte-sonner";

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
        type: 2,
        style: 1,
        label: "New Button",
        custom_id: "",
        emoji: undefined,
      },
    ];
  }
</script>

<RemoveButtonWrapper {onRemove}>
  <div class="flex flex-1 flex-row gap-2 border p-2 items-center flex-wrap rounded">
    {#each components as component, index (index)}
      {#if component.type === ComponentType.Button}
        <Button
          bind:action={component.action}
          bind:label={() => component.label || "Button", (v) => (component.label = v)}
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
          onRemove={() => (components = components.filter((_, i) => i !== index))}
        />
      {/if}
    {/each}
    {#if components.length < 5 && totalComponents < 40 && !components.some((c) => c.type === ComponentType.StringSelect)}
      <UIButton variant="outline" size="sm" class="shrink-0" onclick={addButton}>
        <Plus />
        Add Button
      </UIButton>
    {/if}
  </div>
</RemoveButtonWrapper>
