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
  import DiscordChannel from "$lib/components/DiscordChannel.svelte";
  import { APIRoutes, LongTooltips } from "$lib/constants";
  import { configState, unsavedChanges } from "$lib/stores/config.svelte";
  import { gg } from "$lib/stores/guild.svelte.js";
  import { parseTimestring } from "$lib/utils/timestring";
  import dayjs from "dayjs";
  import equal from "fast-deep-equal/es6";
  import type { ITicketConfig } from "supportmail-types";
  import { slide } from "svelte/transition";

  let oldConfig = $state<ITicketConfig | null>(null);
  let pauseInput = $state<{ type: "duration" | "date"; value: string | null; fail: string | null }>({
    type: "date",
    value: null,
    fail: null,
  });
  let creatingNewForum = $state(false);

  $effect(() => {
    if (!oldConfig && configState.config !== null) {
      oldConfig = $state.snapshot(configState.config);
      return;
    }

    if (!equal(oldConfig, configState.config)) {
      unsavedChanges.set(true);
    } else {
      unsavedChanges.set(false);
    }
  });

  function pauseInputHandler(
    event: Event & {
      currentTarget: EventTarget & HTMLInputElement;
    },
  ) {
    const value = event.currentTarget.value;
    if (pauseInput.type === "date") {
      if (!dayjs(value).isValid()) {
        event.currentTarget.value = "";
        pauseInput.fail = "Invalid date format.";
        return;
      }
      pauseInput.value = dayjs(value).toISOString();
      configState.config.pausedUntil = pauseInput.value;
      pauseInput.fail = null;
    } else {
      if (!/^\d+[0-9wdhms ]*/gi.test(value)) {
        pauseInput.fail =
          "Invalid duration format. Only numbers and 'd', 'h', 'm', 's' are allowed. <a href='https://docs.supportmail.dev/e/timestring' target='_blank' rel='noopener' class='dy-link dy-link-primary'>Learn more (only English is currently supported)</a>";
        console.error(
          "Invalid duration format. Only numbers and 'd', 'h', 'm', 's' are allowed. Visit https://docs.supportmail.dev/e/timestring for more information. Note, that only English is currently supported.",
        );
        return;
      }

      if (value.length) {
        try {
          const parsed = parseTimestring(value);
          pauseInput.value = dayjs().add(parsed, "seconds").toISOString();
          pauseInput.fail = null;

          configState.config.pausedUntil = pauseInput.value;
        } catch (err: any) {
          console.error(err);
          pauseInput.fail = err.message;
        }
      } else {
        console.log("Resetting");
        pauseInput.value = null;
        pauseInput.fail = null;
      }
    }
  }

  async function setupNewForum(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
    creatingNewForum = true;
    event.currentTarget.disabled = true;

    const res = await fetch(APIRoutes.configTicketsSetup(gg.guild!.id), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        forumId: configState.config.forumId,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      oldConfig = data as ITicketConfig;
      configState.config = data; // The response is usually a whole new ticket config object
    } else {
      console.error("Failed to set up new forum", res);
    }
  }

  // Save function?
  unsavedChanges.subscribe((value) => {
    console.log("Unsaved Changes", value);
    if (value) unsavedChanges.set(false);
  });
</script>

<h1 class="my-2 font-bold text-amber-400">Ticket Configuration</h1>

{#if oldConfig && configState.config}
  <!-- 1. Enabled -->
  <div class="settings-container w-full">
    <fieldset id="status">
      <legend>Status</legend>
      <div class="settings-row">
        <label class="dy-fieldset-label w-fit text-base text-white">
          <input
            id="enabled-switch"
            type="checkbox"
            class="dy-toggle dy-toggle-success"
            bind:checked={configState.config.enabled}
            disabled={!!oldConfig.pausedUntil}
          />{configState.config.enabled ? "Enabled" : "Disabled"}
        </label>
      </div>

      {#if configState.config.enabled == false || typeof oldConfig.pausedUntil == "string"}
        <div role="alert" class="dy-alert dy-alert-error dy-alert-soft mb-2" transition:slide={{ duration: 100, axis: "y" }}>
          <div>
            <h1>Ticketing is currently disabled.</h1>
            {#if configState.config.enabled == false}
              <p class="text-base-content">
                No tickets can be opened at the moment, but currently open tickets are still active and can be used to exchange
                messages.
              </p>
            {:else if oldConfig.pausedUntil}
              <p class="text-base-content">
                Ticketing is paused until {new Date(oldConfig.pausedUntil).toLocaleString(navigator.language, {
                  dateStyle: "medium",
                  timeStyle: "long",
                })}.<br />
                See <a href="#paused-until">Paused Until</a> for more information.
              </p>
            {/if}
          </div>
        </div>
      {/if}
    </fieldset>
  </div>

  <!-- The Rest -->
  <div class="w-full {configState.config.enabled ? '' : 'cursor-not-allowed opacity-60 *:pointer-events-none'}">
    <!-- 2. Paused Until -->

    <div class="settings-container">
      <fieldset id="paused-until">
        <legend>Paused Until</legend>
        <div class="settings-row flex w-full max-w-lg flex-col">
          <div class="flex flex-row justify-start gap-2">
            <div class="dy-join dy-join-vertical sm:dy-join-horizontal h-full w-full">
              <button
                onclick={() => {
                  pauseInput.value = null;
                  pauseInput.fail = null;
                  pauseInput.type = pauseInput.type === "date" ? "duration" : "date";
                }}
                class="dy-btn dy-join-item btn-base-300 w-full sm:max-w-25"
                disabled={!!oldConfig.pausedUntil}
              >
                <img src="/icons/arrow-update.svg" alt="Swap Inputs" class="size-5" />
                {pauseInput.type === "date" ? "Duration" : "Date"}
              </button>
              {#if pauseInput.type == "date"}
                <input
                  type="datetime-local"
                  class="dy-input dy-join-item w-full text-base"
                  onchangecapture={pauseInputHandler}
                  min={dayjs().format("YYYY-MM-DDTHH:mm")}
                  disabled={!!oldConfig.pausedUntil}
                />
              {:else}
                <input
                  type="text"
                  class="dy-input dy-join-item w-full"
                  placeholder="Duration | Ex: 1d 2h 30m"
                  onchangecapture={pauseInputHandler}
                  disabled={!!oldConfig.pausedUntil}
                />
              {/if}
            </div>

            <div
              class="dy-tooltip dy-tooltip-top dy-tooltip-info ml-auto flex items-center"
              data-tip={LongTooltips.pausedUntil_tickets}
            >
              <button class="dy-btn dy-btn-circle dy-btn-sm items-center p-0">
                <img src="/icons/question-mark-circle.svg" alt="Help" class="size-6" />
              </button>
            </div>
          </div>

          <!-- Display the date + time the pause will last. -->
          <div role="alert" class="dy-alert dy-alert-info dy-alert-soft w-full p-2">
            <span class="font-mono font-semibold">
              {#if pauseInput.value}
                When saved, Tickets will be paused until {new Date(pauseInput.value).toLocaleString(navigator.language, {
                  dateStyle: "medium",
                  timeStyle: "long",
                })}.
              {:else}
                {pauseInput.type === "date" ? "Select a date and time." : "Enter a duration."}
              {/if}
            </span>
          </div>

          <div class="flex w-full grow flex-row gap-2">
            <button
              class="dy-btn dy-btn-accent grow"
              disabled={!pauseInput}
              onclick={() => {
                pauseInput.value = null;
                pauseInput.fail = null;
              }}
            >
              Reset
            </button>
            <button
              class="dy-btn dy-btn-primary grow"
              disabled={!!oldConfig.pausedUntil || pauseInput.fail !== null}
              onclick={() => unsavedChanges.set(true)}
            >
              Save
            </button>
          </div>
        </div>

        {#if pauseInput.fail}
          <div role="alert" class="dy-alert dy-alert-error dy-alert-soft my-2">
            <div>
              <h1>Invalid Input</h1>
              <p class="text-base-content">{@html pauseInput.fail}</p>
            </div>
          </div>
        {/if}
      </fieldset>
    </div>

    <!-- 3. Forum | Just display it, chaning it is only possible when setting up a new forum -->
    <div class="settings-container">
      <fieldset id="forum-id">
        <legend>Ticket Forum</legend>
        <div class="settings-row flex flex-col gap-3">
          <div class="flex max-w-lg flex-col gap-2 sm:flex-row sm:items-center">
            <div class="display-input w-full sm:max-w-xs">
              {#if oldConfig.forumId}
                <DiscordChannel id={oldConfig.forumId} />
              {:else}
                /
              {/if}
            </div>
            <button class="dy-btn dy-btn-primary w-full shrink md:w-20 md:grow" onclick={setupNewForum}>
              {#if creatingNewForum}
                <progress class="dy-progress dy-progress-success"></progress>
              {:else}
                Set Up
              {/if}
            </button>
          </div>
          <p class="dy-fieldset-label text-xs">
            This is the forum where all tickets are located in. You can't change this setting once it's set.<br />
            You are required to set up a new forum.
          </p>
        </div>
      </fieldset>
    </div>
  </div>
{:else}
  <span class="dy-loading dy-loading-infinity dy-loading-xl select-none"></span>
{/if}
