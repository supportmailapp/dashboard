<script lang="ts">
  import { cn } from "$lib/utils";
  import * as Tabs from "$ui/tabs/index.js";
  import type { APIUser } from "discord-api-types/v10";
  import RoleSelect from "./RoleSelect.svelte";
  import UserSelect from "./UserSelect.svelte";
  import { onMount } from "svelte";

  type Props = {
    /**
     * The default tab to show when the component loads.
     * @default "roles"
     */
    defaultTab?: "users" | "roles";
    /**
     * Whether to only search for bots when searching users.
     * @default false
     */
    botsOnly?: boolean;
    /**
     * Roles to exclude from the search results.
     */
    excludedRoleIds?: string[];
    /**
     * Users to exclude from the search results.
     */
    excludedUserIds?: string[];
    /**
     * Callback when a role is selected.
     */
    onRoleSelect?: (roleid: string) => void;
    /**
     * Callback when a user is selected.
     */
    onUserSelect?: (user: APIUser) => void;
    /**
     * Custom class for the container.
     */
    class?: string;
  };

  let {
    defaultTab = "roles",
    botsOnly = false,
    excludedRoleIds,
    excludedUserIds,
    onRoleSelect,
    onUserSelect,
    class: className,
  }: Props = $props();

  // svelte-ignore state_referenced_locally | we only want to capture the initial value
  let searchMode = $state<"users" | "roles">($state.snapshot(defaultTab));
</script>

<Tabs.Root bind:value={searchMode} class={cn("h-full w-full max-w-xs", className)}>
  <Tabs.List class="w-full">
    <Tabs.Trigger value="roles">Roles</Tabs.Trigger>
    <Tabs.Trigger value="users">{botsOnly ? "Bots" : "Users"}</Tabs.Trigger>
  </Tabs.List>

  <Tabs.Content value="roles">
    <RoleSelect {excludedRoleIds} onSelect={onRoleSelect} />
  </Tabs.Content>

  <Tabs.Content value="users">
    <UserSelect {botsOnly} {excludedUserIds} onSelect={onUserSelect} />
  </Tabs.Content>
</Tabs.Root>
