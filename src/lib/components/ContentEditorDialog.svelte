<script lang="ts">
  import ContentEditor from "$lib/components/ContentEditor.svelte";
  import { IsMobile } from "$lib/hooks/is-mobile.svelte";
  import * as Dialog from "$ui/dialog/index.js";
  import * as Sheet from "$ui/sheet/index.js";
  import type { ClassValue } from "clsx";
  import type { Snippet } from "svelte";

  interface Props {
    /** @default true */
    title: string;
    open?: boolean;
    rawText?: string;
    titleChild?: Snippet;
    contentEditorClasses?: ClassValue;
    /** @default "preview" */
    activeTab?: "editor" | "preview";
    onRawTextChange?: (text: string) => void;
    onOpenChangeComplete?: (open: boolean) => void;
  }

  const isMobile = new IsMobile();

  let {
    open = $bindable(false),
    rawText = $bindable(""),
    activeTab = $bindable("preview"),
    title,
    titleChild,
    contentEditorClasses,
    onRawTextChange,
    onOpenChangeComplete,
  }: Props = $props();
</script>

{#if isMobile.current}
  <Sheet.Root bind:open {onOpenChangeComplete}>
    <Sheet.Content class="flex h-full w-full flex-col p-2 sm:h-200 sm:max-w-270">
      <Sheet.Header class="h-fit p-2">
        <Sheet.Title>
          {#if title}
            {title}
          {:else if titleChild}
            {@render titleChild()}
          {/if}
        </Sheet.Title>
      </Sheet.Header>
      <ContentEditor class={contentEditorClasses} bind:rawText bind:activeTab {onRawTextChange} />
    </Sheet.Content>
  </Sheet.Root>
{:else}
  <Dialog.Root bind:open {onOpenChangeComplete}>
    <Dialog.Content class="flex h-full w-full flex-col sm:h-200 sm:max-w-270">
      <Dialog.Header class="h-fit">
        <Dialog.Title>
          {#if title}
            {title}
          {:else if titleChild}
            {@render titleChild()}
          {/if}
        </Dialog.Title>
      </Dialog.Header>
      <ContentEditor class={contentEditorClasses} bind:rawText bind:activeTab {onRawTextChange} />
    </Dialog.Content>
  </Dialog.Root>
{/if}
