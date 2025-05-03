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

<div class="dy-breadcrumbs text-3xl font-bold *:select-none">
  <ul>
    {#if breadcrumbs.length > 0}
      {#each breadcrumbs as crumb}
        <li class="hover:bg-neutral/40 rounded-md p-1 transition-all duration-150">
          <a href={crumb.href} class="text-white/90" style="text-decoration: none;">
            {crumb.title}
          </a>
        </li>
      {/each}
    {/if}
    <li><span style="text-decoration: none;">{@render children()}</span></li>
  </ul>
</div>
