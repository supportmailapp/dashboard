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
  import { DEFAULT_CONFIG } from "$lib/constants";
  import { gg } from "$lib/stores/guild.svelte.js";
  import { parseTimestring } from "$lib/utils/timestring";
  import dayjs from "dayjs";
  import equal from "fast-deep-equal/es6";
  import type { ITicketConfig } from "supportmail-types";
  import { slide } from "svelte/transition";

  let oldConfig = $derived(gg.config?.ticketConfig || null); // The '!' has to be there because the type would show as {} otherwise
  let newConfig = $state<ITicketConfig>(DEFAULT_CONFIG.ticketConfig);
  let pauseInput = $state<
    { fail: string | null } & ({ type: "date"; value: Date | null } | { type: "duration"; value: string | null })
  >({
    fail: null,
    type: "date",
    value: null,
  });

  $effect(() => {
    // I don't know why 'any' needs to be used here but TS throws an error otherwise. It works in the UserSettingsDialog without it.
    if (oldConfig && equal(newConfig, DEFAULT_CONFIG.ticketConfig)) newConfig = $state.snapshot(oldConfig as any);
  });

  $effect(() => {
    if (pauseInput.value != null) {
      if (pauseInput.type === "date") {
        newConfig.pausedUntil = pauseInput.value.toISOString();
      } else {
        let parsedInput: number | null = null;
        try {
          parsedInput = parseTimestring(pauseInput.value);
        } catch (err) {
          pauseInput.fail = err as string;
          parsedInput = null;
        }
        if (!parsedInput) return;
        const ts = dayjs().add(parsedInput, "seconds");
      }
    }
  });

  async function saveChanges() {}
</script>

<h1 class="my-2 font-bold text-amber-400">Ticket Configuration</h1>
<span class="h-2"></span>

{#if oldConfig}
  <!-- 1. Enabled -->
  <fieldset id="status" class="settings-container">
    <h2 class="dy-fieldset-legend text-xl">Status</h2>
    <label class="dy-fieldset-label py-1 text-base text-white">
      <input
        id="enabled-switch"
        type="checkbox"
        class="dy-toggle dy-toggle-success"
        bind:checked={newConfig.enabled}
        disabled={!!newConfig.pausedUntil}
      />{newConfig.enabled ? "Enabled" : "Disabled"}
    </label>
    {#if newConfig.enabled == false || typeof newConfig.pausedUntil == "string"}
      <div role="alert" class="dy-alert dy-alert-error dy-alert-soft mb-2" transition:slide={{ duration: 100, axis: "y" }}>
        <div>
          <h1>Ticketing is currently disabled.</h1>
          {#if newConfig.enabled == false}
            <p class="text-base-content">
              No tickets can be opened at the moment, but currently open tickets are still active and can be used to exchange
              messages.
            </p>
          {:else}
            <p class="text-base-content">
              Ticketing is paused until {newConfig.pausedUntil?.toLocaleString()}.<br />
              See <a href="#paused-until">Paused Until</a> for more information.
            </p>
          {/if}
        </div>
      </div>
    {/if}
  </fieldset>
  <!-- The Rest -->
  <div
    class="flex w-full flex-col transition-opacity duration-150 select-none {newConfig.enabled
      ? ''
      : 'cursor-not-allowed opacity-60'}"
  >
    <!-- 2. Paused Until -->
    <fieldset id="paused-until" class="settings-container">
      <h2 class="dy-fieldset-legend text-xl">Paused Until</h2>
      <div class="flex flex-col items-start gap-2 md:flex-row md:items-center">
        <button
          onclick={() => {
            pauseInput.value = null;
            pauseInput.type = pauseInput.type === "date" ? "duration" : "date";
          }}
          class="dy-btn dy-btn-dash dy-btn-square dy-btn-sm w-25"
          disabled={!!newConfig.pausedUntil}
        >
          <img src="/icons/arrow-update.svg" alt="Swap Inputs" class="size-5" />
          {pauseInput.type === "date" ? "Duration" : "Date"}
        </button>
        {#if pauseInput.type == "date"}
          <input
            type="datetime-local"
            class="dy-input w-full"
            bind:value={pauseInput.value}
            disabled={!!newConfig.pausedUntil}
          />
        {:else}
          <input
            type="text"
            class="dy-input w-full"
            placeholder="Duration"
            bind:value={pauseInput.value}
            disabled={!!newConfig.pausedUntil}
          />
        {/if}
      </div>
      {#if pauseInput.fail}
        <div role="alert" class="dy-alert dy-alert-error dy-alert-soft my-2">
          <div>
            <h1>Invalid Input</h1>
            <p class="text-base-content">{pauseInput.fail}</p>
          </div>
        </div>
      {/if}

      <div class="flex w-full flex-row items-start gap-2 py-2">
        <button
          class="dy-btn dy-btn-accent w-[50%] md:w-auto"
          disabled={!pauseInput}
          onclick={() => (newConfig.pausedUntil = oldConfig.pausedUntil)}
        >
          Reset
        </button>
        <button class="dy-btn dy-btn-primary w-[50%] md:w-auto" disabled={!!newConfig.pausedUntil} onclick={() => {}}>
          Pause
        </button>
      </div>
      <!-- <p class="text-base-content py-2 text-sm">
        If a date is set, ticketing will be paused until that date. No tickets can be opened until then, but currently open
        tickets are still active and can be used to exchange messages.
      </p> -->
    </fieldset>
  </div>
{:else}
  <span class="dy-loading dy-loading-infinity dy-loading-xl select-none"></span>
{/if}
