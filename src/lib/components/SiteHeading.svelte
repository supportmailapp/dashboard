<script lang="ts">
  import { page } from "$app/state";
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  let {
    title,
    children,
    realTitle,
    subtitle,
    size = "3xl",
    centered = false,
  }: {
    title: string;
    children?: Snippet;
    realTitle?: string | Snippet;
    subtitle?: string | Snippet;
    size?: "xl" | "2xl" | "3xl" | "4xl" | "5xl";
    centered?: boolean;
  } = $props();

  const sizeClasses = {
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
    "5xl": "text-5xl",
  };
</script>

<svelte:head>
  <title>{title} | {page.data.guildsManager.currentGuild?.name ?? "..."}</title>
</svelte:head>

<section class="h-fit w-full max-w-2xl space-y-3" class:text-center={centered}>
  <div class="space-y-2">
    <h1 class={cn("font-bold", sizeClasses[size])}>
      {#if typeof realTitle === "string"}
        {realTitle}
      {:else if realTitle}
        {@render realTitle()}
      {:else}
        {title}
      {/if}
    </h1>

    {#if subtitle}
      <p class="text-muted-foreground text-lg">
        {#if typeof subtitle === "string"}
          {subtitle}
        {:else}
          {@render subtitle()}
        {/if}
      </p>
    {/if}
  </div>

  {#if children}
    {@render children()}
  {/if}
</section>
