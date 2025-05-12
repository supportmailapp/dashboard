<script lang="ts">
  import { page } from "$app/state";
  import { delay } from "$lib";
  import DiscordChannel from "$lib/components/DiscordChannel.svelte";
  import DiscordMention from "$lib/components/DiscordMention.svelte";
  import LoadingDots from "$lib/components/LoadingDots.svelte";
  import RoleSelector from "$lib/components/RoleSelector.svelte";
  import SiteHeader from "$lib/components/SiteHeader.svelte";
  import { BASIC_GET_FETCH_INIT, BASIC_REQUEST_INIT } from "$lib/constants";
  import { gg } from "$lib/stores/guild.svelte";
  import { APIRoutes } from "$lib/urls";
  import timezones from "$lib/utils/timezones";
  import { Folder, MessageSquareText, MessagesSquare, Plus, X } from "@lucide/svelte";
  import dayjs from "dayjs";
  import dayjsTimezone from "dayjs/plugin/timezone";
  import utc from "dayjs/plugin/utc";
  import equal from "fast-deep-equal/es6";
  import ky, { type KyResponse } from "ky";
  import type { Entity, ITicketConfig } from "supportmail-types";
  import { onMount } from "svelte";
  import { blur, scale } from "svelte/transition";

  dayjs.extend(utc);
  dayjs.extend(dayjsTimezone);

  type BasicTicketConfig = Omit<ITicketConfig, "_id" | "creationMessage" | "closeMessage" | "feedback" | "pings" | "tags"> & {
    pings: ["@" | "@&", string][];
  };

  // Constants
  const allDurationUnits = [
    {
      name: "Minutes",
      value: "m",
    },
    {
      name: "Hours",
      value: "h",
    },
    {
      name: "Days",
      value: "d",
    },
  ] as const;
  const guildId = page.params.guildid;

  // State variables
  let config = $state<BasicTicketConfig | null>(null);
  let showRoleSelector = $state(false);
  let isPausedUntil = $state<Date | null>(null);
  let pauseType = $state<"infinite" | "datetime" | "duration">("infinite");
  let timezone = $state<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);
  let tzSearch = $state({
    value: "",
    show: false,
    reset() {
      this.value = "";
      this.show = false;
    },
  });
  let pauseDurations = $state<{ amount: number; unit: "m" | "h" | "d" }[]>([]);
  let showSetupModal = $state(false);
  let setup = $state<{
    categoryId: string | null;
    staff: Entity[];
  }>({
    categoryId: null,
    staff: [],
  });

  // Derived values
  let pauseDateInput = $derived<string>(new Date().toISOString());
  let filteredTimezones = $derived(
    timezones.filter(
      (tz) =>
        tz.name.toLowerCase().includes(tzSearch.value.toLowerCase()) ||
        tz.tzCode.toLowerCase().includes(tzSearch.value.toLowerCase()),
    ),
  );
  let availableUnits = $derived(
    allDurationUnits.reduce(
      (acc, unit) => {
        if (pauseDurations.length === 0) {
          acc.push({
            name: unit.name,
            value: unit.value,
          });
          return acc;
        }
        if (!pauseDurations.find((duration) => duration.unit === unit.value)) {
          acc.push({
            name: unit.name,
            value: unit.value,
          });
        }
        return acc;
      },
      [] as { name: "Minutes" | "Hours" | "Days"; value: "m" | "h" | "d" }[],
    ),
  );
  let estimatedResumeDate = $derived.by<dayjs.Dayjs | null>(() => {
    if (pauseType === "infinite") {
      return null;
    } else if (pauseType === "datetime") {
      return dayjs(pauseDateInput).tz(timezone, true) ?? null;
    } else {
      return pauseDurations.length > 0
        ? pauseDurations.reduce((acc, duration) => acc.add(duration.amount, duration.unit), dayjs())
        : null;
    }
  });

  // Effects
  $effect(() => {
    const current = $state.snapshot(config);
    console.debug("Old config", page.data.dataState.oldConfig);
    console.debug("New config", current);
    if (current !== null) {
      if (equal(page.data.dataState.oldConfig, current)) {
        console.log("No changes detected");
        page.data.dataState.unsaved = false;
      } else {
        console.log("Changes detected");
        page.data.dataState.unsaved = true;

        if (!equal((page.data.dataState.oldConfig as any)?.pausedUntil?.date ?? null, current?.pausedUntil?.date ?? null)) {
          isPausedUntil = null;
        } else {
          isPausedUntil = current?.pausedUntil?.date ?? null;
        }
      }
    }
  });

  // Methods
  async function loadTicketConfig() {
    const response = await ky.get(APIRoutes.configTicketsBase(guildId), BASIC_GET_FETCH_INIT);

    if (response.ok) {
      const jsonData = (await response.json()) as BasicTicketConfig;
      const data: BasicTicketConfig = {
        ...jsonData,
        anonym: {
          enabled: jsonData.anonym?.enabled ?? false,
          user: jsonData.anonym?.user ?? false,
        },
        pausedUntil: jsonData.pausedUntil?.value
          ? {
              value: jsonData.pausedUntil?.value ?? false,
              // jsonData.pausedUntil?.date is a ISOString because we can't ship Date objects in HTTP requests
              date: jsonData.pausedUntil?.date ? new Date(jsonData.pausedUntil?.date) : null,
            }
          : null,
      };
      config = data;
      console.log("Loaded config", data);
      page.data.dataState.oldConfig = structuredClone(data);
      isPausedUntil = data.pausedUntil?.date ?? null;
      if (isPausedUntil) {
        pauseType = "datetime";
      }
    } else {
      console.error(`Failed to load ticket config: ${response.status} ${response.statusText}`, [response]);
    }
  }

  function toggleSetupModal() {
    showSetupModal = !showSetupModal;
  }

  // Page data methods
  page.data.dataState.save = async () => {
    // Prepare data for sending
    const data = $state.snapshot(config);
    if (!data) {
      return console.error("No data to save");
    }
    data.pausedUntil = {
      value: !!data.pausedUntil?.value,
      date: (estimatedResumeDate?.toISOString() ?? null) as any, // We need to ship it to the server as a string
    };

    page.data.dataState.saveProgress = 20;
    console.log("Saving config", data);

    const res = await ky
      .patch(APIRoutes.configTicketsBase(guildId), {
        ...BASIC_REQUEST_INIT("PATCH"),
        json: data,
      })
      .catch((err) => {
        console.error("Failed to save config", err);
        page.data.dataState.saveProgress = 0;
        return err.response as KyResponse; // Somehow this is a KyResponse
      });
    page.data.dataState.saveProgress = 50;

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
    isPausedUntil = $state.snapshot(config.pausedUntil?.date) ?? null;
    if (isPausedUntil) {
      pauseType = "datetime";
    }
  };

  // Lifecycle
  onMount(loadTicketConfig);
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
          <input
            type="checkbox"
            class="dy-toggle dy-toggle-success"
            checked={config.enabled}
            onchange={(e) => {
              if (config) {
                if (e.currentTarget.checked && !config.forumId) {
                  alert("You cannot enable the ticket system without a forum configured!");
                  e.currentTarget.checked = false;
                  return;
                }
                config.enabled = e.currentTarget.checked;
              }
            }}
          />
          <span class="dy-label-text">Enable Ticket System</span>
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
            <input
              type="checkbox"
              class="dy-toggle dy-toggle-warning"
              checked={config.pausedUntil?.value || false}
              onchange={(e) => {
                if (config && e.currentTarget.checked) {
                  config.pausedUntil = { value: true, date: null };
                } else if (config && !e.currentTarget.checked) {
                  config.pausedUntil = { value: false, date: null };
                }
                if (isPausedUntil !== null) {
                  isPausedUntil = null;
                }
              }}
            />
            <span class="dy-label-text">Pause Ticket Creation</span>
          </label>
        </div>

        {#if !isPausedUntil && !!config.pausedUntil?.value}
          <div class="border-base-300 flex flex-col gap-3 rounded-md border p-3" transition:scale={{ duration: 150 }}>
            <p class="text-sm text-slate-400">Choose how long to pause ticket creation:</p>
            <div role="tablist" class="dy-tabs-box flex h-auto w-full flex-col sm:flex-row">
              <button
                transition:blur={{ duration: 150 }}
                class="dy-tab transition-all duration-150"
                class:dy-tab-active={pauseType === "infinite"}
                onclickcapture={() => {
                  pauseType = "infinite";
                  if (config) config.pausedUntil = { value: true, date: null };
                }}
              >
                Until I Unpause
              </button>
              <button
                transition:blur={{ duration: 150 }}
                class="dy-tab transition-all duration-150"
                class:dy-tab-active={pauseType === "datetime"}
                onclickcapture={() => {
                  pauseType = "datetime";
                  if (config) config.pausedUntil = { value: true, date: null };
                }}
              >
                Until Date/Time
              </button>
              <button
                transition:blur={{ duration: 150 }}
                class="dy-tab transition-all duration-150"
                class:dy-tab-active={pauseType === "duration"}
                onclickcapture={() => {
                  pauseType = "duration";
                  if (config) config.pausedUntil = { value: true, date: null };
                }}
              >
                For Duration
              </button>
            </div>

            {#if pauseType === "datetime"}
              <fieldset class="dy-fieldset">
                <legend class="dy-fieldset-legend">Pause Until</legend>
                <input
                  type="datetime-local"
                  placeholder="Select date and time"
                  class="dy-input dy-input-bordered w-full max-w-xs"
                  value={pauseDateInput}
                  min={new Date().toISOString()}
                  onchangecapture={(e) => {
                    // No, we can't bind the value to the input, because we need an ISOString (because of timezone...)
                    pauseDateInput = dayjs(e.currentTarget.value).toISOString();
                    if (config) config.pausedUntil = { value: true, date: new Date(pauseDateInput) };
                  }}
                />
                <label class="dy-input dy-input-primary dy-input-bordered h-8 w-full max-w-xs">
                  <input
                    readonly
                    type="text"
                    value={timezone.replace("_", " ")}
                    placeholder="Timezone"
                    class="w-full truncate"
                  />
                </label>
                <div class="relative">
                  <input
                    type="text"
                    id="timezone-search"
                    placeholder="Search your timezone..."
                    class="dy-input dy-input-bordered w-full max-w-xs"
                    bind:value={tzSearch.value}
                    onfocusin={() => (tzSearch.show = true)}
                    onfocusout={() => (tzSearch.show = false)}
                    autocomplete="off"
                  />
                  {#if tzSearch.show}
                    <div
                      class="bg-base-200 border-neutral absolute z-10 mt-1 max-h-64 w-full max-w-xs overflow-y-auto rounded-md border-[1.5px] shadow-lg"
                      transition:scale={{ duration: 150, delay: 150 }}
                    >
                      {#each filteredTimezones as tz}
                        <button
                          class="w-full px-4 py-2 text-left {timezone !== tz.tzCode ? 'hover:bg-neutral/60' : 'bg-neutral/60'}"
                          onclick={() => {
                            timezone = tz.tzCode;
                            tzSearch.reset();
                          }}
                        >
                          {tz.label}
                        </button>
                      {/each}
                      {#if filteredTimezones.length === 0}
                        <div class="px-4 py-2 text-sm text-slate-400">No results found</div>
                      {/if}
                    </div>
                  {/if}
                </div>
              </fieldset>
            {:else if pauseType === "duration"}
              <div class="flex w-full flex-col gap-1 sm:max-w-sm">
                {#each pauseDurations as duration}
                  <div class="dy-join dy-join-horizontal w-full items-end">
                    <input
                      bind:value={duration.amount}
                      type="number"
                      placeholder="Duration"
                      class="dy-join-item dy-input dy-input-bordered w-full max-w-xs"
                      min="1"
                      max={duration.unit === "m" ? 59 : duration.unit === "h" ? 23 : 30}
                    />
                    <div class="dy-dropdown dy-dropdown-center">
                      <button tabindex="0" class="dy-input w-24 cursor-pointer border-x-0">
                        {allDurationUnits.find((u) => u.value === duration.unit)?.name}
                      </button>
                      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
                      <ul tabindex="0" class="dy-dropdown-content dy-menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
                        {#if availableUnits.length === 0}
                          <li>
                            <button disabled class="dy-btn dy-btn-disabled">No available units</button>
                          </li>
                        {:else}
                          {#each availableUnits as unit}
                            <li>
                              <button
                                onclickcapture={() => {
                                  duration.unit = unit.value;
                                }}
                              >
                                {unit.name}
                              </button>
                            </li>
                          {/each}
                        {/if}
                      </ul>
                    </div>
                    <button
                      class="dy-btn dy-btn-error dy-join-item dy-btn-square w-10"
                      onclick={() => {
                        pauseDurations = pauseDurations.filter((d) => d !== duration);
                      }}
                    >
                      <X class="size-4" />
                    </button>
                  </div>
                {/each}
                {#if pauseDurations.length < 3}
                  <!-- Add new duration group button -->
                  <button
                    class="dy-btn dy-btn-sm dy-btn-neutral"
                    onclick={() => {
                      pauseDurations.push({
                        unit: availableUnits[0].value,
                        amount: 1,
                      });
                    }}
                  >
                    <Plus class="size-4 text-white" />
                  </button>
                {/if}
              </div>
              {#if estimatedResumeDate}
                <div
                  class="bg-info text-info-content rounded-box flex max-w-sm flex-col px-5 py-3 text-sm font-normal sm:flex-row"
                >
                  <span class="mx-auto font-semibold sm:ml-0">Estimated Resume Date</span>
                  <span class="mx-auto sm:mr-0 sm:ml-auto">
                    {estimatedResumeDate
                      ? estimatedResumeDate.toDate().toLocaleString("en-us", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          hourCycle: "h24",
                        })
                      : "N/A"}
                  </span>
                </div>
              {/if}
            {/if}
          </div>
        {:else if isPausedUntil}
          <div class="dy-alert dy-alert-warning dy-alert-vertical">
            <h1 class="font-semibold">Ticket Creation is Paused</h1>
            <p class="text-sm">
              {#if config.pausedUntil?.date}
                Resumes on {isPausedUntil.toLocaleString("en-us", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  hourCycle: "h24",
                })}.
              {:else}
                Resumes when unpaused.
              {/if}
            </p>
            <p class="text-sm">To unpause, please uncheck the "Pause Ticket Creation" option above.</p>
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
          {#if config.forumId}
            <button
              class="dy-btn dy-btn-error"
              onclick={() => {
                if (config) config.forumId = undefined;
              }}
            >
              Remove Forum
            </button>
          {/if}
          <button class="dy-btn dy-btn-primary" onclick={toggleSetupModal}>Setup / Change Forum</button>
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
        <div
          class="bg-base-100 flex h-fit w-full max-w-[500px] flex-wrap justify-start gap-1 rounded border-[1px] border-slate-500 p-2"
        >
          {#if config.pings && config.pings.length > 0}
            {#each config.pings as ping}
              <DiscordMention
                id={ping[1]}
                name={gg.roles?.find((r) => r.id === ping[1])?.name}
                typ="role"
                roleColor={gg.roles?.find((r) => r.id === ping[1])?.color}
                deleteFn={() => {
                  if (config) config.pings = config.pings.filter((p) => p[1] !== ping[1]);
                }}
              />
            {/each}
          {/if}
          <button
            class="bg-base-200 hover:bg-base-200/70 border-base-200 aspect-square size-fit rounded border p-1"
            onclick={() => (showRoleSelector = !showRoleSelector)}
          >
            <Plus class="size-4" />
          </button>
          <RoleSelector
            bind:show={showRoleSelector}
            text="Add a role"
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
            <input type="checkbox" class="dy-toggle dy-toggle-success" bind:checked={config.anonym.enabled} />
            <span class="dy-label-text">Allow Anonymous Staff Replies</span>
          </label>
        </div>
        <div class="dy-form-control w-fit">
          <label class="dy-label cursor-pointer gap-2">
            <input type="checkbox" class="dy-toggle dy-toggle-success" bind:checked={config.anonym.user} />
            <span class="dy-label-text">Allow Anonymous Ticket Creation</span>
          </label>
        </div>
      </div>
    </fieldset>
  </section>
{:else}
  <LoadingDots />
{/if}

<!-- Navigation Section -->
<section class="mt-6">
  <h2 class="mb-3 text-xl font-semibold">Other Configurations</h2>
  <div class="nav-grid">
    <a
      href={`/g/${guildId}/tickets/categories`}
      class="nav-grid-item full-width dy-card bg-accent text-accent-content transition-opacity duration-150 hover:opacity-70"
    >
      <div class="dy-card-body">
        <h3 class="dy-card-title"><Folder class="size-8" />Categories</h3>
        <p>Configure ticket categories.</p>
      </div>
    </a>
    <a
      href={`/g/${guildId}/tickets/feedback`}
      class="nav-grid-item dy-card bg-secondary text-secondary-content transition-opacity duration-150 hover:opacity-70"
    >
      <div class="dy-card-body">
        <h3 class="dy-card-title"><MessageSquareText class="size-8" />Feedback</h3>
        <p>Configure the feedback system.</p>
      </div>
    </a>
    <a
      href={`/g/${guildId}/tickets/custom-messages`}
      class="nav-grid-item dy-card bg-info text-info-content transition-opacity duration-150 hover:opacity-70"
    >
      <div class="dy-card-body">
        <h3 class="dy-card-title"><MessagesSquare class="size-8" />Custom Messages</h3>
        <p>Custom Messages</p>
      </div>
    </a>
  </div>
</section>

<!-- Setup Tickets Modal -->
<div class="dy-modal" class:dy-modal-open={showSetupModal} transition:scale={{ duration: 120 }}>
  <div class="dy-modal-box flex max-w-xl flex-col gap-4">
    <h1>Configure a new ticket forum</h1>
    <fieldset class="dy-fieldset bg-base-200 rounded-box p-4">
      <legend class="dy-fieldset-legend">Select a category</legend>
      <
      <ul class="dy-label">
        <li>You can change the forum later if needed.</li>
        <li>If you don't select a category, a new one will be created.</li>
      </ul>
    </fieldset>
    <div class="mt-6 flex flex-col items-center gap-2 md:flex-row">
      <button class="dy-btn w-full max-w-xs grow md:w-auto" onclick={toggleSetupModal}>Close</button>
      <button class="dy-btn dy-btn-primary w-full max-w-xs grow md:w-auto">Setup</button>
    </div>
  </div>
</div>

<style>
  .nav-grid {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .nav-grid-item {
    flex: 1 1 250px;
  }

  .full-width {
    width: 100%;
    flex: 1 1 100%;
  }
</style>
