<script lang="ts">
  import ContentEditor from "$lib/components/ContentEditor.svelte";
  import * as Dialog from "$ui/dialog/index.js";
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
  }

  let {
    open = $bindable(false),
    rawText = $bindable(""),
    activeTab = $bindable("preview"),
    title,
    titleChild,
    contentEditorClasses,
    onRawTextChange,
  }: Props = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    class="flex h-screen w-screen flex-col sm:max-h-[calc(100%-2rem)] sm:max-w-[calc(100%-2rem)]"
  >
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
