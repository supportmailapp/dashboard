<script lang="ts">
  import * as Command from "$ui/command/index.js";
  import * as Avatar from "$ui/avatar/index.js";
  import { page } from "$app/state";
  import { getNextPathFromGuildPath } from "$lib";
  import { cdnUrls } from "$lib/urls";
  import { cn } from "$lib/utils";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import Plus from "@lucide/svelte/icons/plus";

  let { clickFn }: { clickFn?: () => any } = $props();

  let guildManager = $derived(page.data.guildsManager);
</script>

<Command.Root class="h-full bg-transparent md:min-w-[450px]">
  <Command.Input
    placeholder="Search a server"
    class="[&::placeholder]:text-foreground/50 rounded-lg"
    autofocus={false}
  />
  <Command.List class="max-h-auto h-full py-0.5">
    <Command.Empty>No servers found.</Command.Empty>
    {#each guildManager.guilds as guild (guild.id)}
      {@const _guildHref = guild.isConfigured
        ? `/g/${guild.id + getNextPathFromGuildPath(page.url.pathname)}`
        : `/add/${guild.id}`}
      <Command.LinkItem
        href={_guildHref}
        target="_self"
        value="{guild.id}:{guild.name}"
        class={cn("transition-all duration-120", !guild.isConfigured && "text-foreground/70")}
        onclick={() => {
          if (!page.url.pathname.startsWith(`/g/${guild.id}`)) {
            clickFn?.();
          }
        }}
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
