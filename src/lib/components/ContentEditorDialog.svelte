<script lang="ts">
  import ContentEditor from "$lib/components/ContentEditor.svelte";
  import { cn } from "$lib/utils";
  import * as Dialog from "$ui/dialog/index.js";
  import type { ClassValue } from "clsx";
  import type { Snippet } from "svelte";

  interface Props {
    /** @default true */
    title: string;
    open?: boolean;
    rawText?: string;
    titleChild?: Snippet;
    contentEditorWrapperClasses?: ClassValue;
    contentEditorClasses?: ClassValue;
    /** @default "preview" */
    activeTab?: "editor" | "preview";
  }

  let {
    open = $bindable(false),
    rawText = $bindable(""),
    activeTab = $bindable("preview"),
    title,
    titleChild,
    contentEditorWrapperClasses,
    contentEditorClasses,
  }: Props = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    class="h-screen w-screen max-w-screen grid-rows-[auto_1fr] sm:max-h-[calc(100%-2rem)] sm:max-w-[calc(100%-2rem)]"
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
    <div class={cn("flex h-full w-full flex-1 overflow-y-auto", contentEditorWrapperClasses)}>
      <ContentEditor class={cn("h-full flex-1", contentEditorClasses)} bind:rawText bind:activeTab />
    </div>
  </Dialog.Content>
</Dialog.Root>
