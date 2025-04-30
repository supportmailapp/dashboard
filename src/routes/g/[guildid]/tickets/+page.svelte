<script lang="ts">
  import { page } from "$app/state";
  import { delay } from "$lib";
  import DiscordChannel from "$lib/components/DiscordChannel.svelte";
  import DiscordMention from "$lib/components/DiscordMention.svelte";
  import LoadingDots from "$lib/components/LoadingDots.svelte";
  import RoleSelector from "$lib/components/RoleSelector.svelte";
  import SiteHeader from "$lib/components/SiteHeader.svelte";
  import { APIRoutes, BASIC_GET_FETCH_INIT, BASIC_REQUEST_INIT } from "$lib/constants";
  import { gg } from "$lib/stores/guild.svelte";
  import { MessageSquareText, MessagesSquare, XIcon } from "@lucide/svelte";
  import equal from "fast-deep-equal/es6";
  import ky from "ky";
  import type { ITicketConfig } from "supportmail-types";
  import { onMount } from "svelte";

  type BasicTicketConfig = Omit<ITicketConfig, "_id" | "creationMessage" | "closeMessage" | "feedback" | "pings"> & {
    pings: ["@" | "@&", string][];
  };

  const guildId = page.params.guildid;
  let config = $state<BasicTicketConfig | null>(null);
  let selectorElement = $state<HTMLElement | null>(null);

  $effect(() => {
    const current = $state.snapshot(config);
    console.debug("Old config", page.data.dataState.oldConfig);
    console.debug("New config", current);
    if (config !== null) {
      if (equal(page.data.dataState.oldConfig, current)) {
        console.log("No changes detected");
        page.data.dataState.unsaved = false;
      } else {
        console.log("Changes detected");
        page.data.dataState.unsaved = true;
      }
    }
  });

  // Save the config when the save-button is clicked
  page.data.dataState.save = async () => {
    page.data.dataState.saveProgress = 0;
    const res = await ky.patch(APIRoutes.configTicketsBase(guildId), {
      ...BASIC_REQUEST_INIT("PATCH"),
      json: {
        ...$state.snapshot(config),
      },
    });
    page.data.dataState.saveProgress = 40;

    if (!res.ok) {
      const error = await res.json<any>();
      console.error("Failed to save config", error);
      page.data.dataState.saveProgress = 0;
      page.data.dataState.unsaved = true;
      return;
    }

    await delay(1000);
    page.data.dataState.saveProgress = 80;

    await loadTicketConfig();
    page.data.dataState.saveProgress = 100; // Ensure save progress is set to 100 after loading config
  };

  page.data.dataState.revert = () => {
    console.log("Reverting changes");
    config = page.data.dataState.oldConfig as BasicTicketConfig;
  };

  async function loadTicketConfig() {
    const response = await ky.get(APIRoutes.configTicketsBase(guildId), BASIC_GET_FETCH_INIT);

    if (response.ok) {
      const data = (await response.json()) as BasicTicketConfig;
      config = data;
      console.log("Loaded config", data);
      page.data.dataState.oldConfig = structuredClone(data);
    } else {
      console.error(`Failed to load ticket config: ${response.status} ${response.statusText}`, [response]);
    }
  }

  onMount(loadTicketConfig);

  // Placeholder for pause duration unit
  let pauseDurations = $state<{ amount: number; unit: "m" | "h" | "d" }[]>([]);
  // Placeholder for pause type
  let pauseType = $state<"infinite" | "datetime" | "duration">("infinite");
</script>

<SiteHeader>Tickets</SiteHeader>

{#if !!config}
  <!-- Enable/Disable Section -->
  <section>
    <h2 class="section-header">Ticket System Status</h2>
    <fieldset class="dy-fieldset bg-base-200 border-base-300 rounded-box p-4">
      <legend class="dy-fieldset-legend">Enable/Disable</legend>
      <div class="dy-form-control w-fit">
        <label class="dy-label cursor-pointer gap-2">
          <span class="dy-label-text">Enable Ticket System</span>
          <input type="checkbox" class="dy-toggle dy-toggle-success" bind:checked={config.enabled} />
        </label>
      </div>
    </fieldset>
  </section>

  <!-- Pause Section -->
  <section>
    <h2 class="section-header">Pause Tickets</h2>
    <fieldset class="dy-fieldset bg-base-200 border-base-300 rounded-box p-4">
      <legend class="dy-fieldset-legend">Pause Options</legend>
      <div class="flex flex-col gap-4">
        <div class="dy-form-control w-fit">
          <label class="dy-label cursor-pointer gap-2">
            <span class="dy-label-text">Pause Ticket Creation</span>
            <input
              type="checkbox"
              class="dy-toggle dy-toggle-warning"
              checked={config.pausedUntil?.value || false}
              onchange={(e) => {
                if (config && e.currentTarget.checked) {
                  config.pausedUntil = { value: true, date: null };
                } else if (config && !e.currentTarget.checked) {
                  config.pausedUntil = null;
                }
              }}
            />
          </label>
        </div>

        {#if !!config.pausedUntil?.value}
          <div class="border-base-300 flex flex-col gap-3 rounded-md border p-3">
            <p class="text-sm text-slate-400">Choose how long to pause ticket creation:</p>
            <div class="dy-join dy-join-vertical w-full sm:w-max">
              <button
                class="dy-btn dy-join-item"
                class:dy-btn-active={pauseType === "infinite"}
                onclick={() => {
                  pauseType = "infinite";
                  if (config) config.pausedUntil = { value: true, date: null };
                }}
              >
                Until I Unpause
              </button>
              <button
                class="dy-btn dy-join-item"
                class:dy-btn-active={pauseType === "datetime"}
                onclick={() => {
                  pauseType = "datetime";
                  if (config) config.pausedUntil = { value: true, date: null };
                }}
              >
                Until Date/Time
              </button>
              <button
                class="dy-btn dy-join-item"
                class:dy-btn-active={pauseType === "duration"}
                onclick={() => {
                  pauseType = "duration";
                  if (config) config.pausedUntil = { value: true, date: null };
                }}
              >
                For Duration
              </button>
            </div>

            {#if pauseType === "datetime"}
              <label class="dy-form-control w-full max-w-xs">
                <div class="dy-label">
                  <span class="dy-label-text">Pause Until</span>
                </div>
                <input
                  type="datetime-local"
                  placeholder="Select date and time"
                  class="dy-input dy-input-bordered w-full max-w-xs"
                  bind:value={config.pausedUntil}
                />
              </label>
            {:else if pauseType === "duration"}
              <div class="flex flex-col gap-1">
                <!-- Dynamic and multiple duration combinations are possible by having a button at the bottom which can add another item -->
                {#each pauseDurations as duration, index}
                  <div class="dy-join dy-join-horizontal w-full sm:w-max">
                    <div class="dy-join-item">
                      <label class="dy-form-control w-full max-w-xs">
                        <div class="dy-label">
                          <span class="dy-label-text">Duration</span>
                        </div>
                        <input
                          type="number"
                          placeholder="e.g., 1"
                          class="dy-input dy-input-bordered w-full max-w-xs"
                          bind:value={duration.amount}
                        />
                      </label>
                    </div>
                    <div class="dy-join-item w-40">
                      <select class="dy-select dy-select-bordered" bind:value={duration.unit}>
                        <option value="m">Minutes</option>
                        <option value="h">Hours</option>
                        <option value="d">Days</option>
                      </select>
                    </div>
                    <div class="dy-join-item">
                      <button
                        class="dy-btn dy-btn-error w-fit"
                        onclick={() => {
                          pauseDurations = pauseDurations.filter((_, i) => i !== index);
                        }}
                      >
                        <XIcon class="size-4" />
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </fieldset>
  </section>

  <!-- Ticket Forum Section -->
  <section>
    <h2 class="section-header">Ticket Forum</h2>
    <div class="dy-card bg-base-200 shadow-xl">
      <div class="dy-card-body">
        <h3 class="dy-card-title">Configured Forum</h3>
        {#if gg.channels && config.forumId}
          <div>
            <DiscordChannel id={config.forumId} />
          </div>
        {:else if !gg.channels}
          <LoadingDots />
        {:else}
          <p class="text-warning">No ticket forum configured</p>
        {/if}
        <div class="dy-card-actions justify-end">
          <button class="dy-btn dy-btn-primary">Setup / Change Forum</button>
        </div>
      </div>
    </div>
  </section>

  <!-- Pings Section -->
  <section>
    <h2 class="section-header">Ticket Creation Pings</h2>
    <fieldset class="dy-fieldset bg-base-200 border-base-300 rounded-box p-4">
      <legend class="dy-fieldset-legend">Notify Roles/Users</legend>
      <div class="flex flex-col gap-3">
        <p class="text-sm text-slate-400">Select roles or users to ping when a new ticket is created.</p>
        <div class="dy-dropdown dy-dropdown-start">
          <div
            bind:this={selectorElement}
            tabindex="0"
            role="checkbox"
            aria-checked={config.pings && config.pings.length > 0}
            class="bg-base-100 flex h-fit w-full flex-wrap justify-start gap-1 rounded border-[1px] border-slate-500 p-2 md:max-w-[500px]"
          >
            {#if config.pings && config.pings.length > 0}
              {#each config.pings as ping}
                <DiscordMention
                  id={ping[1]}
                  name={gg.roles?.find((r) => r.id === ping[1])?.name}
                  typ={ping[0] === "@" ? "user" : "role"}
                  roleColor={gg.roles?.find((r) => r.id === ping[1])?.color}
                />
              {/each}
            {:else}
              <span class="text-slate-500 italic">No pings selected</span>
            {/if}
          </div>
          <RoleSelector
            anchor={selectorElement}
            exclude={config.pings?.map((ping) => ping[1])}
            onselect={(role) => {
              config?.pings.push(["@&", role.id]);
            }}
          />
        </div>
      </div>
    </fieldset>
  </section>

  <!-- Anonymous Section -->
  <section>
    <h2 class="section-header">Anonymous Features</h2>
    <fieldset class="dy-fieldset bg-base-200 border-base-300 rounded-box p-4">
      <legend class="dy-fieldset-legend">Anonymity Settings</legend>
      <div class="flex flex-col gap-4">
        <div class="dy-form-control w-fit">
          <label class="dy-label cursor-pointer gap-2">
            <span class="dy-label-text">Allow Anonymous Staff Replies</span>
            <input type="checkbox" class="dy-toggle" bind:checked={config.anonym.enabled} />
          </label>
        </div>
        <div class="dy-form-control w-fit">
          <label class="dy-label cursor-pointer gap-2">
            <span class="dy-label-text">Allow Anonymous Ticket Creation</span>
            <input type="checkbox" class="dy-toggle" bind:checked={config.anonym.user} />
          </label>
        </div>
      </div>
    </fieldset>
  </section>

  <!-- Navigation Section -->
  <section class="mt-6">
    <h2 class="mb-3 text-xl font-semibold">Other Configurations</h2>
    <div class="nav-grid">
      <a
        href={`/g/${guildId}/tickets/feedback`}
        class="nav-grid-item dy-card bg-info text-info-content transition-opacity duration-150 hover:opacity-70"
      >
        <div class="dy-card-body">
          <h3 class="dy-card-title"><MessageSquareText class="size-8" />Feedback</h3>
          <p>Configure the feedback system.</p>
        </div>
      </a>
      <a
        href={`/g/${guildId}/tickets/messages`}
        class="nav-grid-item dy-card bg-success text-success-content transition-opacity duration-150 hover:opacity-70"
      >
        <div class="dy-card-body">
          <h3 class="dy-card-title"><MessagesSquare class="size-8" />Custom Messages</h3>
          <p>Custom Messages</p>
        </div>
      </a>
    </div>
  </section>
{:else}
  <LoadingDots />
{/if}

<style>
  .nav-grid {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;

    .nav-grid-item {
      flex: 1 1 250px;
      margin: 5px;
    }
  }
</style>
