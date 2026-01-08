<script lang="ts">
  // import "@skyra/discord-components-core";
  import "$lib/assets/markup.css";
  import { toDiscordHtml } from "$lib/utils/markup";
  import Textarea from "$ui/textarea/textarea.svelte";
  import { browser } from "$app/environment";
  import * as Tabs from "$ui/tabs/index.js";
  import type { ClassValue } from "clsx";
  import { cn } from "$lib/utils";

  let {
    rawText = $bindable(""),
    activeTab = $bindable("preview"),
    class: className,
  }: {
    rawText: string;
    class?: ClassValue;
    activeTab?: "editor" | "preview";
  } = $props();

  let markupDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let debouncedRaw = $state.snapshot(rawText);
  let currentHtml = $state(toDiscordHtml($state.snapshot(rawText)));
  let html = $derived.by(() => {
    debouncedRaw = $state.snapshot(rawText);
    debounceMarkup();
    return $state.snapshot(currentHtml);
  });
  let currentTab = $state<"editor" | "preview">("preview");
  let markupDebounceMs = $derived(currentTab === "editor" ? 1000 : 400);

  function debounceMarkup() {
    if (!browser) return;
    if (markupDebounceTimer) clearTimeout(markupDebounceTimer);

    markupDebounceTimer = setTimeout(async () => {
      currentHtml = toDiscordHtml(debouncedRaw);
      console.log("Rendered markdown to HTML for preview:", { raw: debouncedRaw, html: currentHtml });
    }, markupDebounceMs);
  }
</script>

<div class={cn("flex h-full w-full overflow-hidden bg-gray-950", className)}>
  <Tabs.Root bind:value={currentTab} class="flex h-full w-full flex-col">
    <Tabs.List class="w-full">
      <Tabs.Trigger value="editor">Editor</Tabs.Trigger>
      <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="editor" class="mt-4 flex flex-col flex-1 min-h-0">
      <Textarea bind:value={rawText} placeholder="Enter your markdown here..." rows={10} class="w-full h-full resize-none overflow-y-auto" />
    </Tabs.Content>
    <Tabs.Content value="preview" class="mt-4 h-full">
      <!-- Tell tailwind to ignore this section -->
      <div
        class="prose prose-invert discord-message h-full max-h-none max-w-none pt-1 overflow-y-auto"
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
        {@html html}
        <!-- <discord-messages>
          <discord-message bot verified author="SupportMail" avatar="/logo.png" timstamp="">
          </discord-message>
        </discord-messages> -->
      </div>
    </Tabs.Content>
  </Tabs.Root>
</div>
