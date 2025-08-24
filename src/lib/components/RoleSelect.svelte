<script lang="ts">
  import { page } from "$app/state";
  import * as Command from "$ui/command/index.js";
  import { Skeleton } from "$ui/skeleton";

  type Props = {
    excludedRoleIds?: string[];
    onSelect?: (role: GuildRole) => void;
  };

  let { excludedRoleIds, onSelect }: Props = $props();

  function isRoleExcluded(role: GuildRole): boolean {
    return excludedRoleIds !== undefined && excludedRoleIds.includes(role.id);
  }

  let filteredRoles = $derived<GuildRole[]>(
    page.data.guildsManager.roles?.filter((role) => !isRoleExcluded(role)) ?? [],
  );

  function roleClick(roleId: string) {
    return () => onSelect?.(filteredRoles.find((r) => r.id === roleId)!);
  }
</script>

<Command.Root class="h-fit w-full rounded-lg border shadow-md">
  <Command.Input placeholder="Search roles..." />
  <Command.List class="max-h-60 overflow-y-auto">
    <Command.Empty>No roles found.</Command.Empty>
    {#if !page.data.guildsManager.rolesLoaded}
      {#each new Array(3) as _}
        <Command.Item disabled>
          <div class="bg-muted size-3 rounded-full"></div>
          <Skeleton class="h-4 w-full" />
        </Command.Item>
      {/each}
    {:else}
      {#each filteredRoles as role}
        <Command.Item
          value="{role.id}:{role.name}"
          class="max-w-xs cursor-pointer transition duration-80 active:scale-[99%]"
          onSelect={roleClick(role.id)}
        >
          <div
            class="size-3 rounded-full"
            style="background-color: #{role.color?.toString(16).padStart(6, '0') || '99aab5'}"
          ></div>
          <p class="truncate">{role.name}</p>
        </Command.Item>
      {/each}
    {/if}
  </Command.List>
</Command.Root>
