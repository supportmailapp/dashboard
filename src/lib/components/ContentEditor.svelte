<script lang="ts">
  import "$lib/assets/markup.css";
  import { browser } from "$app/environment";
  import * as Tabs from "$ui/tabs/index.js";
  import type { ClassValue } from "clsx";
  import { cn } from "$lib/utils";
  import { discordMdToHtml } from "$lib/utils/markup";
  import Textarea from "$ui/textarea/textarea.svelte";
  import LoadingSpinner from "./LoadingSpinner.svelte";

  let {
    rawText = $bindable(""),
    activeTab = $bindable("preview"),
    maxlength = 2000,
    class: className,
    onRawTextChange,
  }: {
    rawText: string;
    maxlength?: number;
    class?: ClassValue;
    activeTab?: "editor" | "preview";
    onRawTextChange?: (text: string) => void;
  } = $props();

  let markupDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let debouncedRaw = $state($state.snapshot(rawText));
  let currentTab = $state<"editor" | "preview">("preview");
  let markupDebounceMs = $derived(currentTab === "editor" ? 1000 : 400);

  function debounceRawText() {
    if (!browser) return;
    onRawTextChange?.(rawText);
    if (markupDebounceTimer) clearTimeout(markupDebounceTimer);

    markupDebounceTimer = setTimeout(async () => {
      debouncedRaw = $state.snapshot(rawText);
      console.log("Debounced raw text updated:", String.raw`${debouncedRaw}`);
    }, markupDebounceMs);
  }
</script>

<!-- TODO: Make maxLength a prop -->

<div class={cn("flex h-full w-full overflow-hidden", className)}>
  <Tabs.Root bind:value={currentTab} class="flex h-full w-full flex-col gap-3 overflow-hidden">
    <Tabs.List class="w-full *:text-lg *:font-semibold">
      <Tabs.Trigger value="editor">Editor</Tabs.Trigger>
      <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="editor" class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Textarea
        bind:value={rawText}
        placeholder="Enter your markdown here..."
        rows={10}
        class="w-full flex-1 resize-none bg-zinc-900"
        oninput={debounceRawText}
        {maxlength}
      />
    </Tabs.Content>
    <Tabs.Content value="preview" class="flex min-h-0 w-full flex-1 overflow-hidden">
      <!-- Tell tailwind to ignore this section -->
      <div
        class="prose prose-invert discord-message w-full max-w-none overflow-y-auto rounded-lg px-3 py-2"
        style="background-color: rgb(54, 57, 62)"
        {@attach (e) => {
          e.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            const mentionContainer = target.closest("[data-slot='mention-container']");
            if (mentionContainer) {
              const mentionText = mentionContainer.textContent || "";
              navigator.clipboard.writeText(mentionText).then(() => {
                console.log(`Copied mention text to clipboard: ${mentionText}`);
              });
            }

            // If click is on span.spoiler, reveal it
            const spoiler = target.closest("span.spoiler");
            console.log("Clicked element:", target, "Spoiler found:", spoiler);
            if (spoiler) {
              spoiler.classList.add("revealed");
            }
          });
        }}
      >
        {#await discordMdToHtml(debouncedRaw)}
          <LoadingSpinner />
        {:then html}
          {@html html}
        {/await}
      </div>
    </Tabs.Content>
  </Tabs.Root>
</div>
