<script lang="ts">
  import { page } from "$app/state";
  import Home from "$lib/assets/home.svelte";
  import { PLUGINS } from "$lib/constants";
  import { site } from "$lib/stores/site.svelte";
  import { user } from "$lib/stores/user.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { slide } from "svelte/transition";
  import { buildNavHref, showServerSelect } from "./navigation.svelte";

  let _user = $derived(user.get());

  function isCurrentPage(href: string = "/") {
    return page.url.pathname === href;
  }
</script>

<nav class="bg-base-200 flex flex-row" transition:slide={{ duration: 350, axis: "x" }}>
  <ul class="dy-menu dy-rounded-box w-56">
    <a
      href="/"
      id="branding"
      class="my-2 flex cursor-pointer flex-row items-center justify-around text-slate-200 transition-opacity duration-100 ease-linear select-none hover:opacity-60"
    >
      <img src="/logo.png" alt="Logo" class="dy-avatar size-8 drop-shadow-md" />
      <span class="text-2xl font-bold">SupportMail</span>
    </a>
    <div class="dy-divider mx-0 my-1"></div>
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
      <a href={buildNavHref("/")} class={isCurrentPage(buildNavHref("/")) ? "bg-base-300 no-animation" : ""}>
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
