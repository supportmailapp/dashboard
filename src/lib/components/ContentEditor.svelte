<script lang="ts">
  // import "@skyra/discord-components-core"; | maybe this isn't needed after all
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
    class: className,
    onRawTextChange,
  }: {
    rawText: string;
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
      console.log("Debounced raw text updated:", debouncedRaw);
    }, markupDebounceMs);
  }
</script>

<div class={cn("flex h-full w-full overflow-hidden bg-gray-950", className)}>
  <Tabs.Root bind:value={currentTab} class="flex h-full w-full flex-col">
    <Tabs.List class="w-full">
      <Tabs.Trigger value="editor">Editor</Tabs.Trigger>
      <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="editor" class="mt-4 flex min-h-0 flex-1 flex-col">
      <Textarea
        bind:value={rawText}
        placeholder="Enter your markdown here..."
        rows={10}
        class="h-full w-full resize-none overflow-y-auto"
        oninput={debounceRawText}
      />
    </Tabs.Content>
    <Tabs.Content value="preview" class="mt-4 h-full">
      <!-- Tell tailwind to ignore this section -->
      <div
        class="prose prose-invert discord-message max-h-none max-w-none overflow-y-auto px-3 py-2 rounded-lg"
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
          <div
            class="sr-only"
            {@attach () => {
              console.log(html);
            }}
          ></div>
          {@html html}
        {/await}
      </div>
    </Tabs.Content>
  </Tabs.Root>
</div>
