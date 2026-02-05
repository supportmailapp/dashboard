<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { getBreadcrumbs } from "../../breadcrumb.svelte";

  const crumbs = getBreadcrumbs();
  onMount(() => {
    crumbs.set({ label: "Reports", href: "/reports" }, { label: "Archive", href: "/reports/archive" });
  });
  onDestroy(() => {
    crumbs.pop();
  });
</script>

You are a mod, do mod stuff here.
