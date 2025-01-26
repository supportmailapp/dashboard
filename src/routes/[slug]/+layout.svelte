<script>
  import DesktopNavigation from "$lib/baseComponents/DesktopNavigation.svelte";
  import MobileNavigation from "$lib/baseComponents/MobileNavigation.svelte";
  import { mediaQuery } from "$lib/constants";
  import { slide } from "svelte/transition";
  let { children } = $props();

  let clientWidth = $state(1920);
</script>

<svelte:window bind:innerWidth={clientWidth} />

<!-- 
Idea: Complete buttom navigation (mobile and desktop)
-->
