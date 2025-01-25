<script lang="ts">
  import "../app.css";
  import type { Snippet } from "svelte";
  import type { LayoutData } from "./$types";
  import Footer from "$lib/baseComponents/Footer.svelte";

  let { children, data }: { data: LayoutData; children: Snippet } = $props();
</script>

<!-- Layout for server selection or login -->
{@render children()}

<Footer year={data.date.getFullYear()} />
