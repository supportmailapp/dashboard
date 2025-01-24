<script lang="ts">
  import "../app.css";
  import type { Snippet } from "svelte";
  import type { LayoutData } from "./$types";

  let { children }: { data: LayoutData; children: Snippet } = $props();
</script>

<!-- Layout for server selection or login -->
{@render children()}
