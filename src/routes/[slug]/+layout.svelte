<script>
  import { mediaQuery } from "$lib/constants";
  import { slide } from "svelte/transition";
  let { children } = $props();

  let clientWidth = $state(1920);
</script>

<svelte:window bind:innerWidth={clientWidth} />

<!--  -->