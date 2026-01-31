<script lang="ts">
  import type { SMMediaItem } from "$lib/sm-types/src";
  import { buttonVariants } from "$ui/button/button.svelte";
  import Pencil from "@lucide/svelte/icons/pencil";
  import RemoveButtonWrapper from "./RemoveButtonWrapper.svelte";
  import * as Popover from "$ui/popover/index.js";
  import * as Field from "$ui/field/index.js";
  import { cn } from "$lib/utils";
  import Input from "$ui/input/input.svelte";
  import Switch from "$ui/switch/switch.svelte";
  import { fade } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";

  type Props = ComponentWithRemoveHandler<SMMediaItem> & {
    inGallery?: boolean;
  };

  let {
    inGallery = false,
    url = $bindable(""),
    description = $bindable(""),
    spoiler = $bindable(false),
    onRemove,
  }: Props = $props();

  let urlBuffer = $state($state.snapshot(url));

  function validateUrl(value: string): boolean {
    // validate URL format + if image link
    try {
      const url = new URL(value);
      return /\.(jpeg|jpg|gif|png|webp|svg)$/.test(url.pathname);
    } catch {
      return false;
    }
  }
</script>

<RemoveButtonWrapper {onRemove} class="flex-0">
  <div
    class={cn("bg-card relative h-30 overflow-hidden rounded border", inGallery ? "w-80 sm:w-30" : "w-30")}
  >
    {#if url}
      <img src={url} alt={description} class="h-full w-full object-cover" />
    {:else}
      <div
        class="bg-muted/40 text-muted-foreground flex h-full w-full items-center justify-center select-none"
      >
        <span class="text-sm italic">No Media URL</span>
      </div>
    {/if}

    {#if spoiler}
      <div
        class="absolute inset-0 bg-linear-to-br from-violet-500/20 to-blue-500/20"
        transition:fade={{ duration: 200, easing: cubicInOut }}
      ></div>
    {/if}

    <Popover.Root>
      <Popover.Trigger
        class={buttonVariants({ variant: "outline", size: "icon-sm", class: "absolute right-2 bottom-2" })}
      >
        <Pencil />
      </Popover.Trigger>
      <Popover.Content class="w-80">
        <Field.Group>
          <Field.Field>
            <Field.Label>Media URL</Field.Label>
            <Input
              type="url"
              placeholder="https://example.com/media.jpg"
              bind:value={
                () => urlBuffer || "",
                (v) => {
                  urlBuffer = v;
                  if (validateUrl(v)) {
                    url = v;
                  }
                }
              }
            />
          </Field.Field>

          <Field.Field>
            <Field.Label>Description (Alt Text)</Field.Label>
            <Field.Description>
              Text that describes the media for screen readers and accessibility.
            </Field.Description>
            <Input type="text" placeholder="A description of the media" bind:value={description} />
          </Field.Field>

          <Field.Field orientation="horizontal">
            <Field.Label>Spoiler</Field.Label>
            <Switch bind:checked={spoiler} />
          </Field.Field>
        </Field.Group>
      </Popover.Content>
    </Popover.Root>
  </div>
</RemoveButtonWrapper>
