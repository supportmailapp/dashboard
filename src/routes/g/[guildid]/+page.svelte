<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { buildNavHref } from "$lib/components/navigation.svelte";
  import RefreshButton from "$lib/components/RefreshButton.svelte";
  import { PLUGINS } from "$lib/constants";
  import { gg } from "$lib/stores/guild.svelte";
  import { user } from "$lib/stores/user.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { CircleCheck, CircleX, Info, MessageSquareWarning, TriangleAlert } from "@lucide/svelte";

  let serverIdCopied = $state(false);
  let serverIdText = $derived(serverIdCopied ? "Copied!" : "Copy Server ID");
  let news = $state<News[]>(page.data.news || []);

  $effect(() => {
    console.log("guild", $state.snapshot(gg.guild));
    console.log("channels", $state.snapshot(gg.channels));
    console.log("roles", $state.snapshot(gg.roles));
  });
</script>

{#if gg.guild && user.discord}
  <div class="flex w-full flex-row items-center justify-start gap-5">
    <img src={cdnUrls.guildIcon(gg.guild.id, gg.guild.iconHash, "512")} alt="Server icon" class="size-20" />
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
            {gg.guild.name}
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
    <div tabindex="0" class="dy-collapse dy-collapse-arrow bg-base-300/60 mb-3">
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
  <h2 class="text-3xl font-semibold text-white underline-offset-2 select-none">Plugins</h2>
  <div class="flex w-full flex-wrap">
    {#each PLUGINS as plugin}
      <div class="flex w-full p-2 sm:w-1/2 md:pl-0">
        <button onclick={() => goto(buildNavHref(plugin.slug))} class="plugin-card">
          <h1 class="flex items-center gap-1 font-semibold text-white">
            <img src={plugin.iconUrl} alt="{plugin.name} icon" class="aspect-square size-9" />
            <span>{plugin.name}</span>
            {#if plugin.isNew}
              <div class="dy-badge dy-badge-accent rounded-full">NEW</div>
            {/if}
          </h1>
          <p>{plugin.description}</p>
        </button>
      </div>
    {/each}
  </div>
{:else}
  <div class="flex h-full w-full items-center justify-center">
    <span class="dy-loading dy-loading-infinity mx-auto my-auto"></span>
    {#await new Promise((r) => setTimeout(r, 5000)) then}
      <RefreshButton text="Already added the bot? Refresh!" whatInvalidate={page.url} />
    {/await}
  </div>
{/if}
