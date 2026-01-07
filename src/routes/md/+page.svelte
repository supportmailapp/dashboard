<script lang="ts">
  import "@skyra/discord-components-core";
  import { toDiscordHtml } from "$lib/utils/markup";
  import { dateToLocalString } from "$lib/utils/formatting";

  let raw = $state("");
  let html = $derived(toDiscordHtml(raw));
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

<style>
  discord-message {
    display: block;
    margin: 1rem 0;

    --discord-message-font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    --discord-message-font-size: 16px;
  }

</style>
