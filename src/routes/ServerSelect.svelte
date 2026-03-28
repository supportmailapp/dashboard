<script lang="ts">
  import { page } from "$app/state";
  import { getNextPathFromGuildPath } from "$lib";
  import { getManager } from "$lib/stores/GuildsManager.svelte";
  import { cdnUrls } from "$lib/urls.svelte";
  import { cn } from "$lib/utils";
  import * as Avatar from "$ui/avatar/index.js";
  import * as Command from "$ui/command/index.js";
  import Skeleton from "$ui/skeleton/skeleton.svelte";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import Plus from "@lucide/svelte/icons/plus";
  import { slide } from "svelte/transition";

  let { hrefAfterSelection, showLoading }: { hrefAfterSelection?: string; showLoading?: boolean } = $props();

  const guildsManager = getManager();
</script>

{#if showLoading || !guildsManager.loaded}
  <div class="h-full bg-transparent md:min-w-md" out:slide={{ duration: 200, axis: "y" }}>
    <div class="max-h-auto h-full py-0.5 scroll-py-1 overflow-hidden">
      {#each new Array(10) as _, index}
        <Skeleton class="w-full h-12 my-1" animationDelay={index * 100} />
      {/each}
    </div>
  </div>
{:else}
  <Command.Root class="h-full bg-transparent md:min-w-md">
    <Command.Input
      placeholder="Search a server"
      class="placeholder:text-foreground/50 rounded-lg"
      autofocus={false}
    />
    <Command.List class="max-h-auto h-full py-0.5">
      <Command.Empty>No servers found.</Command.Empty>
      {#each guildsManager.guilds as guild (guild.id)}
        {@const guildPath = getNextPathFromGuildPath(page.url.pathname)}
        {@const suffix = guildPath !== "/" ? guildPath : (hrefAfterSelection || "/home")}
        {@const encodedSuffix = suffix.startsWith("/") ? suffix : `/${suffix}`}
        {@const _guildHref = guild.isConfigured
          ? `/-/${guild.id}${encodedSuffix}`
          : `/invite/${guild.id}`}
        <Command.LinkItem
          href={_guildHref}
          value="{guild.id}:{guild.name}"
          class={cn("transition-all duration-120", !guild.isConfigured && "text-foreground/70")}
        >
          <Avatar.Root>
            <Avatar.Image src={cdnUrls.guildIcon(guild.id, guild.icon, 128)} alt={guild.name} />
            <Avatar.Fallback>{guild.name.slice(0, 2).toUpperCase()}</Avatar.Fallback>
          </Avatar.Root>
          <span class="max-w-40 truncate">{guild.name}</span>
          {#if guild.isConfigured}
            <ArrowRight class="ml-auto text-current" />
          {:else}
            <Plus class="ml-auto text-current" />
          {/if}
        </Command.LinkItem>
      {/each}
    </Command.List>
  </Command.Root>
{/if}