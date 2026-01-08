<script lang="ts">
  import "./markup.css";
  import "@skyra/discord-components-core";
  import { toDiscordHtml } from "$lib/utils/markup";
  import { dateToLocalString } from "$lib/utils/formatting";
  import { APIRoutes } from "$lib/urls";

  let raw = $state("❌");
  let html = $derived(toDiscordHtml(raw));

  // Since twemoji stuff is hard, proxy the unicode in <discord-unicode-emoji> through an API route which serves the proper img tag
  async function twemojiProxy(emoji: string): Promise<string> {
    const response = await fetch(APIRoutes.twemojiProxy(emoji));
    if (!response.ok) {
      console.error("Failed to fetch twemoji:", response.statusText);
      return emoji; // Fallback to the original emoji
    }
    return await response.text();
  }

  $effect(() => {
    // Replace all <discord-unicode-emoji> elements with their proxied img tags
    const parser = new DOMParser();
    const doc = parser.parseFromString(html as string, "text/html");
    const emojiElements = doc.querySelectorAll("discord-unicode-emoji");

    if (emojiElements.length === 0) return;

    Promise.all(
      Array.from(emojiElements).map(async (el) => {
        const emoji = el.textContent || "";
        const imgTag = await twemojiProxy(emoji);
        const span = document.createElement("span");
        span.innerHTML = imgTag;
        el.replaceWith(span.firstChild!);
      })
    ).then(() => {
      html = doc.body.innerHTML;
    });
  });
</script>

<div class="w-full block spacing-y-3 bg-gray-950 *:w-full">
  <textarea bind:value={raw} placeholder="Enter your markdown here..." rows="10"></textarea>
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
