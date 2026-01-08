<script lang="ts">
  import { dateToLocalString } from "$lib/utils/formatting";
  import { toDiscordHtml } from "$lib/utils/markup";
  import "@skyra/discord-components-core";
  import "./markup.css";
  import Textarea from "$ui/textarea/textarea.svelte";
  import { browser } from "$app/environment";

  const MARKUP_DEBOUNCE_MS = 600;
  let markupDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let raw = $state("❌ yoyo 🔥\n🔥");
  // svelte-ignore state_referenced_locally
  let debouncedRaw = $state.snapshot(raw);
  // svelte-ignore state_referenced_locally
  let currentHtml = $state(toDiscordHtml($state.snapshot(raw)));
  let html = $derived.by(() => {
    debouncedRaw = raw;
    debounceMarkup();
    return $state.snapshot(currentHtml);
  });

  function debounceMarkup() {
    if (!browser) return;
    if (markupDebounceTimer) clearTimeout(markupDebounceTimer);

    markupDebounceTimer = setTimeout(async () => {
      currentHtml = toDiscordHtml(debouncedRaw);
      console.log("Rendered markdown to HTML for preview:", { raw: debouncedRaw, html: currentHtml });
    }, MARKUP_DEBOUNCE_MS);
  }
</script>

<div class="w-full block spacing-y-3 bg-gray-950 *:w-full">
  <div class="p-2">
    <Textarea bind:value={raw} placeholder="Enter your markdown here..." rows={10} />
  </div>
  {#if !raw}
    <em>Rendered output will appear here...</em>
  {:else}
    <!-- Tell tailwind to ignore this section -->
    <div class="prose max-w-none prose-invert" style="width: 100%">
      <discord-messages>
        <discord-message bot verified author="SupportMail" avatar="/logo.png" timestamp={dateToLocalString(new Date())}>
          {@html html}
        </discord-message>
      </discord-messages>
    </div>
  {/if}
</div>
