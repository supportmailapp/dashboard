<script lang="ts">
  import type { Snippet } from "svelte";

  let { title, children }: { title?: string | Snippet; children?: Snippet } = $props();
</script>

<section class="h-fit w-full max-w-2xl space-y-3">
  <h1 class="text-3xl font-bold">
    {#if typeof title === "string"}
      {title}
    {:else if title}
      {@render title()}
    {/if}
  </h1>
  {@render children?.()}
</section>
