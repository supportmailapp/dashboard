<script lang="ts">
  import { getManager } from "$lib/stores/GuildsManager.svelte";
  import * as Command from "$ui/command/index.js";
  import { Skeleton } from "$ui/skeleton";
  import type { APIRole } from "discord-api-types/v10";
  import Role from "./Role.svelte";

  type Props = {
    excludedRoleIds?: string[];
    /** Whether to include bot roles */
    bots?: boolean;
    onSelect?: (roleId: string) => void;
  };

  let { excludedRoleIds, bots, onSelect }: Props = $props();
  const guildsManager = getManager();

  let roles = () => guildsManager.roles;
  let filteredRoles = $derived.by(() => {
    if (!roles().size) return null;
    let filtered = roles()
      .values()
      .filter((r) => !excludedRoleIds?.includes(r.id))
      .filter((r) => (bots ? true : !r.managed))
      .toArray();

    return filtered;
  });

  function handleRoleSelect(role: APIRole) {
    onSelect?.(role.id);
  }

  $effect(() => {
    if (!roles().size) {
      guildsManager.loadRoles();
    }
  });
</script>

<Command.Root class="h-fit w-full rounded-lg border shadow-md">
  <Command.Input placeholder="Search roles..." />
  <Command.List class="max-h-60 overflow-y-auto">
    <Command.Empty>No roles found.</Command.Empty>
    {#if !guildsManager.rolesLoaded}
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
          class="max-w-xs cursor-pointer p-1 transition duration-80 active:scale-[99%]"
          onSelect={() => handleRoleSelect(role)}
        >
          <Role roleId={role.id} class="hover:bg-muted/20 bg-transparent duration-75" />
        </Command.Item>
      {/each}
    {/if}
  </Command.List>
</Command.Root>
