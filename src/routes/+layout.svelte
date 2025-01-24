<script lang="ts">
  import "../app.css";
  import type { Snippet } from "svelte";
  import type { LayoutData } from "./$types";

  let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<div class="bg-secondary mx-auto flex w-screen flex-col items-center justify-center">
  {@render children()}
</div>
