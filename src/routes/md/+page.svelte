<script lang="ts">
  import { APIRoutes } from "$lib/urls";
  import { dateToLocalString } from "$lib/utils/formatting";
  import { toDiscordHtml } from "$lib/utils/markup";
  import "@skyra/discord-components-core";
  import "./markup.css";
  import Textarea from "$ui/textarea/textarea.svelte";
  import { browser } from "$app/environment";

  const MARKUP_DEBOUNCE_MS = 600;
  let markupDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let raw = $state("❌ yoyo");
  // svelte-ignore state_referenced_locally
  let debouncedRaw = $state.snapshot(raw);
  // svelte-ignore state_referenced_locally
  let currentHtml = $state(toDiscordHtml($state.snapshot(raw)));
  let html = $derived.by(() => {
    debouncedRaw = raw;
    debounceMarkup();
    return $state.snapshot(currentHtml);
  });

  // Twemoji cache to avoid refetching the same emoji
  const twemojiCache = new Map<string, string>();

  // Since twemoji stuff is hard, proxy the unicode in <discord-unicode-emoji> through an API route which serves the proper img tag
  async function twemojiProxy(emoji: string): Promise<string> {
    // Check cache first
    if (twemojiCache.has(emoji)) {
      return twemojiCache.get(emoji)!;
    }

    const response = await fetch(APIRoutes.twemojiProxy(emoji));
    if (!response.ok) {
      console.error("Failed to fetch twemoji:", response.statusText);
      twemojiCache.set(emoji, emoji);
      return emoji; // Fallback to the original emoji
    }

    const text = await response.text();
    twemojiCache.set(emoji, text);
    return text;
  }

  function debounceMarkup() {
    if (!browser) return;
    if (markupDebounceTimer) clearTimeout(markupDebounceTimer);

    markupDebounceTimer = setTimeout(async () => {
      currentHtml = toDiscordHtml(debouncedRaw);

      // Replace all <discord-unicode-emoji> elements with their proxied img tags
      const parser = new DOMParser();
      const doc = parser.parseFromString(currentHtml as string, "text/html");
      const emojiElements = doc.querySelectorAll("discord-unicode-emoji");

      if (emojiElements.length === 0) return;

      await Promise.all(
        Array.from(emojiElements).map(async (el) => {
          const emoji = el.textContent || "";
          const imgTag = await twemojiProxy(emoji);
          const span = document.createElement("span");
          span.innerHTML = imgTag;
          el.replaceWith(span.firstChild!);
        })
      );

      currentHtml = doc.body.innerHTML;
    }, MARKUP_DEBOUNCE_MS);
  }
</script>

<div class="w-full block spacing-y-3 bg-gray-950 *:w-full">
  <Textarea bind:value={raw} placeholder="Enter your markdown here..." rows={10} class="m-2"></Textarea>
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
