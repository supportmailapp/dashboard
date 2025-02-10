<script lang="ts">
  import Home from "$lib/assets/home.svelte";
  import { user } from "$lib/stores/user.svelte";
  import { cdnUrls } from "$lib/utils/formatting";
  import { slide } from "svelte/transition";
  import { showServerSelect } from "./navigation.svelte";
  import NavigationDialog from "./NavigationDialog.svelte";

  const _user = $derived(user.get());
</script>

<div id="mobileNav" class="mobile-navbar" transition:slide={{ duration: 350, axis: "y" }}>
  <button class="dy-btn dy-btn-xl bg-base-100 h-full w-full flex-col gap-x-3 py-1.5">
    <svg class="size-[1em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      ><g fill="currentColor" stroke-linejoin="miter" stroke-linecap="butt"
        ><circle
          cx="12"
          cy="12"
          r="3"
          fill="none"
          stroke="currentColor"
          stroke-linecap="square"
          stroke-miterlimit="10"
          stroke-width="2"
        ></circle><path
          d="m22,13.25v-2.5l-2.318-.966c-.167-.581-.395-1.135-.682-1.654l.954-2.318-1.768-1.768-2.318.954c-.518-.287-1.073-.515-1.654-.682l-.966-2.318h-2.5l-.966,2.318c-.581.167-1.135.395-1.654.682l-2.318-.954-1.768,1.768.954,2.318c-.287.518-.515,1.073-.682,1.654l-2.318.966v2.5l2.318.966c.167.581.395,1.135.682,1.654l-.954,2.318,1.768,1.768,2.318-.954c.518.287,1.073.515,1.654.682l.966,2.318h2.5l.966-2.318c.581-.167,1.135-.395,1.654-.682l2.318.954,1.768-1.768-.954-2.318c.287-.518.515-1.073.682-1.654l2.318-.966Z"
          fill="none"
          stroke="currentColor"
          stroke-linecap="square"
          stroke-miterlimit="10"
          stroke-width="2"
        ></path></g
      ></svg
    >
    <span class="text-sm">Settings</span>
  </button>

  <button class="dy-btn dy-btn-xl bg-base-100 h-full w-full flex-col gap-x-3 py-1.5" onclick={showServerSelect}>
    <img src="/icons/controls.svg" alt="Controls" class="size-6" />
    <span class="text-sm">Servers</span>
  </button>

  <button class="dy-btn dy-btn-xl bg-base-100 flex h-full w-full flex-col gap-x-3 py-1.5">
    {#if _user}
      <div class="size-6">
        <img src={cdnUrls.userAvatar(_user.id, _user.avatar, "128")} alt="User Avatar" class="rounded-sm" />
      </div>
    {:else}
      <div class="dy-skeleton size-6"></div>
    {/if}
    <span class="text-sm">You</span>
  </button>
</div>
