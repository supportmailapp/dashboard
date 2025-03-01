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

  let enabled = $derived(gg.oldConfig?.ticketConfig.enabled);

  $effect(() => {
    console.log($state.snapshot(gg.newConfig));
  });
</script>

<h1 class="text-amber-400">Ticket Configuration</h1>

<div class="mb-4 flex items-center">
  <label for="enabled-switch" class="mr-2">Enabled</label>
  <input
    id="enabled-switch"
    type="checkbox"
    class="dy-toggle checked:dy-toggle-success"
    checked={gg.newConfig?.ticketConfig.enabled}
    onclick={() => {
      if (gg.newConfig) gg.newConfig.ticketConfig.enabled = !gg.newConfig.ticketConfig.enabled;
    }}
  />
</div>

{#if gg.oldConfig}
  <div class="transition-opacity duration-150 select-none {enabled ? '' : 'cursor-not-allowed opacity-60'}">
    <!--  -->
    <div class="text-wrap">
      <p>Old Config</p>
      <pre class="text-xs">
      {@html JSON.stringify(gg.oldConfig)}
    </pre>
      <p>New Config</p>
      <pre class="text-xs">
      {@html JSON.stringify(gg.newConfig)}
    </pre>
    </div>
  </div>
{:else}
  <span class="dy-loading dy-loading-spinner dy-loading-xl select-none"></span>
{/if}
