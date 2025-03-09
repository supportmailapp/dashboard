<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { buildNavHref } from "$lib/components/navigation.svelte";
  import { APIRoutes, LANGUAGES, PLUGINS } from "$lib/constants";
  import { gg } from "$lib/stores/guild.svelte";
  import { user } from "$lib/stores/user.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { CircleCheck, CircleX, Info, TriangleAlert } from "@lucide/svelte";

  let serverIdCopied = $state(false);
  let serverIdText = $derived(serverIdCopied ? "Copied!" : "Copy Server ID");
  let news = $state<News[]>(page.data.news || []);
  let guildLang = $state<{ loading: boolean; value: string | null; saved: boolean }>({
    loading: true,
    value: null,
    saved: false,
  });

  $effect(() => {
    console.log("guild", $state.snapshot(gg.guild));
    console.log("config", $state.snapshot(gg.config));
    console.log("channels", $state.snapshot(gg.channels));
    console.log("roles", $state.snapshot(gg.roles));
  });

  $effect(() => {
    if (gg.config && guildLang.value == null) {
      guildLang.value = $state.snapshot(gg.config.lang);
      guildLang.loading = false;
    }
  });

  async function changeLanguage(e: Event & { currentTarget: EventTarget & HTMLSelectElement }) {
    console.log("Changing language", e.currentTarget.value);
    if (!gg.config || !gg.guild) throw new Error("Guild or Config not loaded!");
    const lang = e.currentTarget.value;

    guildLang.loading = true;

    const res = await fetch(APIRoutes.config.base(gg.guild!.id), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lang: lang }),
      credentials: "include",
    });

    if (!res.ok) {
      console.error("Failed to change language", res);
      guildLang.loading = false;
      return;
    }

    gg.config.lang = lang;
    guildLang.value = lang;
    guildLang.loading = false;
    document.getElementById("guild-language")?.classList.replace("dy-select-primary", "dy-select-success");
    setTimeout(() => {
      document.getElementById("guild-language")?.classList.replace("dy-select-success", "dy-select-primary");
    }, 1500);
  }
</script>

<div class="flex w-full flex-row items-center justify-start gap-5">
  <img src={cdnUrls.guildIcon(gg.guild!.id, gg.guild!.iconHash, "512")} alt="Server icon" class="size-20" />
  <div>
    <div class="flex flex-row items-center justify-start gap-3">
      <div
        class="dy-tooltip md:dy-tooltip-right dy-tooltip-bottom {serverIdCopied ? 'dy-tooltip-success' : 'dy-tooltip-accent'}"
        data-tip={serverIdText}
      >
        <button
          class="server-id-button"
          onclick={() => {
            if (serverIdCopied || !gg.guild) return;
            navigator.clipboard.writeText(gg.guild.id);
            serverIdCopied = true;
            setTimeout(() => {
              serverIdCopied = false;
            }, 2000);
          }}
        >
          {gg.guild!.name}
        </button>
      </div>
    </div>
    <div class="h-3"></div>
    <h2 class="pl-1 text-xl font-semibold text-white">
      Welcome <span class="text-amber-300">{user.discord?.displayName}</span>!
    </h2>
  </div>
</div>
<span class="dy-divider dy-divider-neutral my-0"></span>
{#if news.length > 0}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div tabindex="0" class="dy-collapse dy-collapse-arrow bg-base-300/60">
    <input type="checkbox" class="news-peer" checked />
    <div class="dy-collapse-title flex flex-row items-center gap-2 font-semibold text-white">News</div>
    <div class="dy-collapse-content text-primary-content flex flex-col gap-1.5">
      {#each news as news}
        <div role="alert" class="dy-alert dy-alert-horizontal {`dy-alert-${news.type}`}">
          {#if news.type === "info"}
            <Info color="currentColor" />
          {:else if news.type === "success"}
            <CircleCheck color="currentColor" />
          {:else if news.type === "warning"}
            <TriangleAlert color="currentColor" />
          {:else}
            <CircleX color="currentColor" />
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
<!-- General Guild Settings -->
<h2 class="mt-2 text-3xl font-semibold text-white underline-offset-2 select-none">General Settings</h2>
<div class="settings-container p-0">
  <fieldset>
    <legend>Server Language</legend>
    <select
      class="dy-select dy-select-primary w-full border-2 transition-colors duration-200"
      id="guild-language"
      name="guild-language"
      onchangecapture={changeLanguage}
      disabled={guildLang.loading}
    >
      {#each LANGUAGES as lan}
        <option value={lan.value} selected={gg.config!.lang == lan.value}>{lan.name}</option>
      {/each}
    </select>
    <p class="dy-fieldset-label text-xs">
      This changes the language the bot uses in your server for non-ephemeral messages.<br />
      It can also be the default for a user if the user has not set a language.
    </p>
  </fieldset>
</div>

<!-- Access Control -->
<h2 class="mt-2 text-3xl font-semibold text-white underline-offset-2 select-none">Access Control</h2>
<div class="pointer-events-none flex w-full flex-col items-center opacity-40 select-none">
  <h3 class="text-base italic">Coming Soon...</h3>
</div>
