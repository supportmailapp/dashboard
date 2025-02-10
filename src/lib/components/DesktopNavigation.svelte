<script lang="ts">
  import { page } from "$app/state";
  import Home from "$lib/assets/home.svelte";
  import { PLUGINS } from "$lib/constants";
  import { site } from "$lib/stores/site.svelte";
  import { user } from "$lib/stores/user.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { slide } from "svelte/transition";
  import { buildNavHref, showServerSelect } from "./navigation.svelte";
  import { goto } from "$app/navigation";

  let _user = $derived(user.get());

  function isCurrentPage(href: string = "/") {
    return page.url.pathname === href;
  }
</script>

<nav class="bg-base-200 dy-drawer flex w-50 flex-row" transition:slide={{ duration: 350, axis: "x" }}>
  <ul class="dy-menu bg-base-200 dy-rounded-box w-56">
    <li>
      <button class="justify-around" onclick={() => (site.userMenu = true)}>
        {#if _user}
          <div class="dy-avatar">
            <div class="w-16 rounded-xl">
              <img src={cdnUrls.userAvatar(_user.id, _user.avatar, "512")} alt="User Avatar" />
            </div>
          </div>
        {:else}
          <div class="dy-skeleton h-32 w-32"></div>
        {/if}
        <img src="/chevron-double-right.svg" alt="Open User Menu" class="size-10" />
      </button>
    </li>
    <li></li>
    <li class="dy-dropdown dy-dropdown-right w-full">
      <!-- Server select -->
      <button class="dy-btn dy-btn-wide dy-btn-secondary" onclick={showServerSelect}>Change Server</button>
    </li>
    <li></li>
    <li class="dy-menu-title select-none">Plugins</li>
    <li>
      <!-- svelte-ignore a11y_invalid_attribute -->
      <a href="" class={isCurrentPage(buildNavHref("/")) ? "bg-base-300 no-animation" : ""}>
        <Home size={6} />
        <span class={isCurrentPage(buildNavHref("/")) ? "text-warning text- font-semibold" : ""}>Home</span>
      </a>
    </li>
    {#each PLUGINS as plugin}
      <li class="mt-1">
        <a href={buildNavHref(plugin.slug)} class={isCurrentPage(buildNavHref(plugin.slug)) ? "dy-menu-active" : ""}>
          <img src={plugin.iconUrl} alt={plugin.name} class="size-6" />
          <span class={isCurrentPage(buildNavHref(plugin.slug)) ? "text-warning font-semibold" : ""}>{plugin.name}</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>
