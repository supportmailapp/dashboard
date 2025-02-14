<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { buildNavHref } from "$lib/components/navigation.svelte";
  import RefreshButton from "$lib/components/RefreshButton.svelte";
  import { PLUGINS } from "$lib/constants";
  import { gg } from "$lib/stores/guild.svelte";
  import { site } from "$lib/stores/site.svelte";
  import { user } from "$lib/stores/user.svelte";
  import { cdnUrls } from "$lib/utils/formatting";

  let serverIdCopied = $state(false);
  let serverIdText = $derived(serverIdCopied ? "Copied!" : "Copy Server ID");

  $effect(() => {
    console.log("guild", $state.snapshot(gg.guild));
    console.log("channels", $state.snapshot(gg.channels));
    console.log("roles", $state.snapshot(gg.roles));
  });
</script>

{#if gg.guild && user.get()}
  <div style="padding: 1rem;">
    <div class="flex h-30 flex-row items-center justify-start gap-5">
      <img src={cdnUrls.guildIcon(gg.guild.id, gg.guild.iconHash, "512")} alt="Server icon" class="size-30" />
      <div>
        <div class="flex flex-row items-center justify-start gap-3">
          <div
            class="dy-tooltip dy-tooltip-right {serverIdCopied ? 'dy-tooltip-success' : 'dy-tooltip-accent'}"
            data-tip={serverIdText}
          >
            <button
              class="text-primary cursor-pointer p-1 text-4xl font-bold underline underline-offset-4 transition-all duration-150 ease-linear"
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
        <h2 class="pl-1 text-3xl font-semibold text-white">
          Welcome <span class="text-amber-300">{user.get()?.displayName}</span>!
        </h2>
      </div>
    </div>
    <div class="h-3"></div>
    {#if site.news && site.news.length > 0}
      <h2 class="text-2xl font-semibold text-white underline-offset-2">News</h2>
      <div class="h-3"></div>
      {#each site.news as news}
        <div class="flex flex-col items-center justify-start gap-3">
          <h3 class="text-xl font-semibold text-white">{news.title}</h3>
          <p class="text-white">{news.content}</p>
        </div>
      {/each}
      <div class="h-5"></div>
      <span class="dy-divider dy-divider-primary"></span>
    {/if}
    <div class="h-5"></div>
    <h2 class="text-3xl font-semibold text-white underline-offset-2 select-none">Plugins</h2>
    <div class="h-3"></div>
    <div class="flex w-full flex-row gap-2">
      {#each PLUGINS as plugin}
        <button
          onclick={() => goto(buildNavHref(plugin.slug))}
          class="dy-card bg-base-200 shadow-base-300 w-84 cursor-pointer items-start justify-start p-2 transition-all duration-150 ease-linear hover:shadow-md sm:p-4"
        >
          <div class="dy-card-body p-3">
            <h2 class="flex items-center gap-0.5 font-semibold text-white">
              <img src={plugin.iconUrl} alt="{plugin.name} icon" class="size-8" />
              {plugin.name}
              {#if plugin.isNew}
                <div class="dy-badge dy-badge-secondary rounded-full">NEW</div>
              {/if}
            </h2>
            <p class="text-start">{plugin.description}</p>
          </div>
        </button>
      {/each}
    </div>
  </div>
{:else}
  <div class="flex h-full w-full items-center justify-center">
    <span class="dy-loading dy-loading-spinner mx-auto my-auto"></span>
    <RefreshButton text="Already added the bot? Refresh!" whatInvalidate={page.url} />
  </div>
{/if}
