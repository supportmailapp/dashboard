<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    breadcrumbs?: {
      title: string;
      href: string;
    }[];
    /**
     * Just the Title of the current site.
     */
    children: Snippet;
  };
  let { children, breadcrumbs = [] }: Props = $props();
</script>

<div class="dy-breadcrumbs text-3xl font-bold">
  <ul>
    {#if breadcrumbs.length > 0}
      {#each breadcrumbs as crumb}
        <li>
          <a href={crumb.href} class="text-gray-500 hover:text-gray-700">
            {crumb.title}
          </a>
        </li>
      {/each}
    {/if}
    <li>{@render children()}</li>
  </ul>
</div>
