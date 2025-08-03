<script lang="ts">
  import * as Command from "$ui/command/index.js";
  import * as Avatar from "$ui/avatar/index.js";
  import { page } from "$app/state";
  import { getNextPathFromGuildPath } from "$lib";
  import { cdnUrls } from "$lib/urls";
  import { cn } from "$lib/utils";
  import ArrowRight from "@lucide/svelte/icons/arrow-right";
  import Plus from "@lucide/svelte/icons/plus";

  let guildManager = $derived(page.data.guildsManager);
</script>

<Command.Root class="h-full rounded-lg border shadow-md md:min-w-[450px]">
  <Command.Input placeholder="Search a server" autofocus={false} />
  <Command.List class="max-h-auto h-full">
    <Command.Empty>No servers found.</Command.Empty>
    {#each guildManager.guilds as guild (guild.id)}
      {@const _guildHref = guild.isConfigured
        ? `/g/${guild.id + getNextPathFromGuildPath(page.url.pathname)}`
        : `/add/${guild.id}`}
      <Command.LinkItem
        href={_guildHref}
        value="{guild.id}:{guild.name}"
        class={cn(
          "cursor-pointer pr-3 transition-all duration-100 active:scale-99",
          !guild.isConfigured && "text-muted-foreground hover:text-white",
        )}
      >
        <Avatar.Root>
          <Avatar.Image src={cdnUrls.guildIcon(guild.id, guild.icon, 128)} alt={guild.name} />
          <Avatar.Fallback>{guild.name.slice(0, 2).toUpperCase()}</Avatar.Fallback>
        </Avatar.Root>
        <span class="max-w-40 truncate">{guild.name}</span>
        {#if guild.isConfigured}
          <ArrowRight class="ml-auto text-white" />
        {:else}
          <Plus class="ml-auto" />
        {/if}
      </Command.LinkItem>
    {/each}
  </Command.List>
</Command.Root>
