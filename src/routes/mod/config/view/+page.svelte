<script lang="ts">
  import style from "svelte-highlight/styles/atom-one-dark-reasonable";
  import json from "svelte-highlight/languages/json";
  import Highlight, { LineNumbers } from "svelte-highlight";
  import * as Tabs from "$ui/tabs/index.js";
  import { page } from "$app/state";

  let hash = $derived(page.url.hash); // We assume this is base64 encoded JSON that should be displayed

  function parseHash() {
    if (!hash) return null;
    try {
      const decoded = atob(hash.slice(1)); // Remove the '#' character
      return JSON.parse(decoded);
    } catch (e) {
      console.error("Failed to parse hash as JSON:", e);
      return null;
    }
  }

  function previewJSON(obj: any) {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  }
</script>

<svelte:head>
  {@html style}
</svelte:head>

<h1 class="mb-2 text-lg font-bold">Config Data Viewer</h1>

{#if hash}
  <div class="w-full rounded-md">
    <Highlight language={json} code={previewJSON(parseHash())} />
  </div>
{:else}
  <p>No config data provided in the URL hash.</p>
{/if}
