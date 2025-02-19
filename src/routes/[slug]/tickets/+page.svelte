<!-- Ticket Configuration
Page Contents:

1. **Enabled**: `ticketConfig.enabled`
2. **Paused Until**: `ticketConfig.pausedUntil`
3. **Forum ID**: `ticketConfig.forumId`
4. **Tags**: `ticketConfig.tags`
5. **Anonymous Tickets**: `ticketConfig.anonym.user`
6. **Anonymous Enabled**: `ticketConfig.anonym.enabled`
7. **Anonymous Alias**: `ticketConfig.anonym.alias`
8. **Auto Forwarding**: `ticketConfig.autoForwarding`
9. **Creation Message**: `ticketConfig.creationMessage`
10. **Close Message**: `ticketConfig.closeMessage`
11. **Pings**: `ticketConfig.pings`
12. **Allowed Bots**: `ticketConfig.allowedBots`
13. **Feedback Configuration**: `ticketConfig.feedback`

-->

<script lang="ts">
  import { gg } from "$lib/stores/guild.svelte.js";
  import type { ITicketConfig } from "supportmail-types";

  let enabled = $state(true);
  let config = $state(gg.config?.ticketConfig as ITicketConfig);
</script>

<h1 class="text-amber-400">Ticket Configuration</h1>

<div class="mb-4 flex items-center">
  <label for="enabled-switch" class="mr-2">Enabled</label>
  <input id="enabled-switch" type="checkbox" class="dy-toggle checked:dy-toggle-success" bind:checked={config.enabled} />
</div>

{#if config}
  <div class="transition-opacity duration-150 select-none {enabled ? '' : 'cursor-not-allowed opacity-60'}">
    Some content here
  </div>
{:else}
  <span class="dy-loading dy-loading-spinner dy-loading-xl select-none"></span>
{/if}
