<script lang="ts">
  import { page } from "$app/state";
  import { getManager } from "$lib/stores/GuildsManager.svelte";
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";

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

  let h1Element: HTMLHeadingElement;
  let hasBeenViewed = $state(false);
  const guildsManager = getManager();

  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            hasBeenViewed = true;
          }
        });
      },
      { threshold: 0.1 },
    );

    if (h1Element) {
      observer.observe(h1Element);
    }

    return () => {
      observer.disconnect();
    };
  });
</script>

<svelte:head>
  <title>{title} | {guildsManager.currentGuild?.name ?? "..."}</title>
</svelte:head>

<section class="mb-6 h-fit w-full max-w-2xl space-y-3" class:text-center={centered}>
  <div class="space-y-2">
    <h1
      bind:this={h1Element}
      class={cn("un space-b font-bold", sizeClasses[size], hasBeenViewed && "force-un")}
    >
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
