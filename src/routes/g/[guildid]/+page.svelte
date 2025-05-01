<script lang="ts">
  import { page } from "$app/state";
  import { delay, turnGuildConfigIntoOverview, type ConfigOverview } from "$lib";
  import DiscordChannel from "$lib/components/DiscordChannel.svelte";
  import LoadingDots from "$lib/components/LoadingDots.svelte";
  import SiteHeader from "$lib/components/SiteHeader.svelte";
  import { APIRoutes, BASIC_GET_FETCH_INIT, BASIC_REQUEST_INIT, NavigationItems, SupportedLanguages } from "$lib/constants";
  import { gg } from "$lib/stores/guild.svelte";
  import { site } from "$lib/stores/site.svelte";
  import { user } from "$lib/stores/user.svelte";
  import { CircleCheck, CircleX, Info, TriangleAlert } from "@lucide/svelte";
  import equal from "fast-deep-equal";
  import ky from "ky";
  import { type FlattenMaps } from "mongoose";
  import type { IDBGuild } from "supportmail-types";
  import { onMount } from "svelte";

  const guildId = page.params.guildid;
  let config = $state<ConfigOverview | null>(null);
  let news = $state<News[]>(page.data.news || []);

  const navigation = NavigationItems(guildId);

  $effect(() => {
    if (config !== null) {
      const current = $state.snapshot(config);
      console.debug("Old config", page.data.dataState.oldConfig);
      console.debug("New config", current);
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
    const res = await ky.patch(APIRoutes.configBase(guildId), {
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

    await loadConfigOverview();
    page.data.dataState.saveProgress = 100; // Ensure save progress is set to 100 after loading config
  };

  page.data.dataState.revert = () => {
    console.log("Reverting changes");
    config = page.data.dataState.oldConfig as ConfigOverview;
  };

  async function loadConfigOverview() {
    const response = await ky.get(APIRoutes.configBase(guildId), BASIC_GET_FETCH_INIT);

    if (response.ok) {
      const data = (await response.json()) as FlattenMaps<IDBGuild & { _id: string }>;
      const _config = turnGuildConfigIntoOverview(data);
      config = _config;
      console.log("Loaded config", _config);
      page.data.dataState.oldConfig = structuredClone(_config);
      site.showLoading = false;
    } else {
      console.error(`Failed to load guild config: ${response.status} ${response.statusText}`, [response]);
    }
  }

  onMount(loadConfigOverview);
</script>

<SiteHeader>
  Welcome <span class="from-primary to-success w-fit bg-gradient-to-r bg-clip-text text-transparent">
    {user.discord?.displayName}
  </span>!
</SiteHeader>

{#if news.length > 0}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div tabindex="0" class="dy-collapse dy-collapse-arrow bg-base-300/60">
    <input type="checkbox" class="news-peer" checked />
    <div class="dy-collapse-title flex flex-row items-center gap-2 font-semibold text-white">News</div>
    <div class="dy-collapse-content text-primary-content flex flex-col gap-1.5">
      {#each news as news}
        <div role="alert" class="dy-alert dy-alert-horizontal {`dy-alert-${news.type}`}">
          {#if news.type === "info"}
            <Info class="text-info-content" />
          {:else if news.type === "success"}
            <CircleCheck class="text-success-content" />
          {:else if news.type === "warning"}
            <TriangleAlert class="text-warning-content" />
          {:else}
            <CircleX class="text-error-content" />
          {/if}
          <div>
            <h3 class="font-bold">{news.title}</h3>
            <div class="text-xs">{news.content}</div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- Language Selector -->
<section>
  <h2 class="section-header">Server Settings</h2>
  <div class="flex flex-col gap-3">
    <fieldset class="dy-fieldset bg-base-200 border-base-300 rounded-box w-full max-w-md p-4">
      <legend class="dy-fieldset-legend">Server Language</legend>
      {#if !!config?.lang}
        <select class="dy-select dy-select-bordered w-full" bind:value={config.lang}>
          {#each SupportedLanguages as language}
            <option value={language.value}>
              {language.name}
            </option>
          {/each}
        </select>
        <p class="label text-sm text-slate-400">
          This will be used for the bot's public responses as well as when a user does not have a language set.
        </p>
      {:else}
        <LoadingDots />
      {/if}
    </fieldset>
  </div>
</section>

<section>
  <h2 class="section-header">Overview</h2>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div class="dy-card bg-base-200 shadow-xl">
      <div class="dy-card-body">
        <h3 class="dy-card-title">Ticket Forum</h3>
        {#if gg.channels && config?.ticketForum}
          <div>
            <DiscordChannel
              id={config?.ticketForum}
              name={gg.channels.find((c) => c.id === config?.ticketForum)?.name || "Unknown"}
            />
          </div>
        {:else if !gg.channels}
          <LoadingDots />
        {:else}
          <p class="text-warning">No ticket forum configured</p>
        {/if}
      </div>
    </div>

    <div class="dy-card bg-base-200 shadow-xl">
      <div class="dy-card-body">
        <h3 class="dy-card-title">Alert Channel</h3>
        {#if gg.channels && config?.alertChannel}
          <div>
            <DiscordChannel
              id={config?.alertChannel}
              name={gg.channels.find((c) => c.id === config?.alertChannel)?.name || "Unknown"}
            />
          </div>
        {:else if !gg.channels}
          <LoadingDots />
        {:else}
          <p class="text-warning">No alert channel configured</p>
        {/if}
      </div>
    </div>
  </div>
</section>

<!-- Navigation Cards -->
<section class="mt-6">
  <h2 class="mb-3 text-xl font-semibold">Dashboard Navigation</h2>
  <div class="nav-grid">
    {#each navigation as item}
      <a
        href={item.href}
        class="nav-grid-item dy-card {item.color} text-neutral-content transition-opacity duration-150 hover:opacity-70"
      >
        <div class="dy-card-body">
          <h3 class="dy-card-title"><item.icon class="size-8" />{item.name}</h3>
          <p>{item.description}</p>
        </div>
      </a>
    {/each}
  </div>
</section>

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
