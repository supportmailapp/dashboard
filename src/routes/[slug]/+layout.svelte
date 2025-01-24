<script>
  import '../app.css';

  import DesktopNavigation from '$lib/baseComponents/DesktopNavigation.svelte';
  import MobileNavigation from '$lib/baseComponents/MobileNavigation.svelte';
  import { mediaQuery } from '$lib/constants';
  import { slide, fly } from 'svelte/transition';
  let { children } = $props();

  let clientWidth = $state(1920);
</script>

<svelte:window bind:innerWidth={clientWidth} />

<div class="flex w-screen flex-row">
  {#if clientWidth > mediaQuery.sm}
    <div class="bg-primary w-[20%] lg:w-[15%]" role="cell" transition:slide={{ duration: 350, axis: 'x' }}>
      <DesktopNavigation />
    </div>
  {/if}
  <div class="bg-secondary w-full" role="cell">
    {@render children()}
  </div>
</div>

{#if clientWidth <= mediaQuery.sm}
  <div id="mobileNav" class="w-full">
    <MobileNavigation />
  </div>
{/if}
