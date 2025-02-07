<script lang="ts">
  import { cdnUrls } from "$lib/utils/formatting";
  import { user } from "$lib/stores/user.svelte";
  import { globalState } from "$lib/stores/global.svelte";
  import { slide } from "svelte/transition";

  let _user = $derived(user.get());
</script>

<nav class="bg-base-200 dy-drawer flex w-50 flex-row" transition:slide={{ duration: 350, axis: "x" }}>
  <ul class="dy-menu bg-base-200 dy-rounded-box w-56">
    <li>
      <button class="justify-around" onclick={() => (globalState.userMenu = true)}>
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
    <li>
      <a>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        Item 1
      </a>
    </li>
    <li>
      <a>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Item 2
      </a>
    </li>
    <li>
      <a>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Item 3
      </a>
    </li>
  </ul>
</nav>
