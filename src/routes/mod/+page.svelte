<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { getBreadcrumbs } from "./breadcrumb.svelte";

  const crumbs = getBreadcrumbs();
  onMount(() => {
    crumbs.push("Home");
  });
  onDestroy(() => {
    crumbs.pop();
  });
</script>

You are a mod, do mod stuff here.
