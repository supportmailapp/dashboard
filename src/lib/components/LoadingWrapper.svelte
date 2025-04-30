<script lang="ts">
  import type { Snippet } from "svelte";
  import LoadingDots from "./LoadingDots.svelte";

  type Props = {
    configLoaded: boolean;
    children: Snippet;
  };
  let { configLoaded, children }: Props = $props();
</script>

{#if configLoaded}
  {@render children()}
{:else}
  <div class="p-10">
    <LoadingDots />
  </div>
{/if}
