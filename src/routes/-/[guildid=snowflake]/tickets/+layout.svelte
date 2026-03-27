<script lang="ts">
  import { watch } from "runed";
  import { page } from "$app/state";
  import { initCategoriesManager } from "$lib/stores/categories.svelte.js";

  const cats = initCategoriesManager();

  watch(
    () => page.params.guildid,
    () => {
      cats.fetch(true);
    },
  );

  let { children } = $props();
</script>

{@render children?.()}
