<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import type { APIUser } from "discord-api-types/v10";
  import RoleSelect from "./RoleSelect.svelte";
  import UserSelect from "./UserSelect.svelte";
  import { cn } from "$lib/utils";

  type Props = {
    /**
     * The default tab to show when the component loads.
     * @default "roles"
     */
    defaultTab?: "users" | "roles";
    /**
     * Whether to show the roles tab.
     * @default true
     */
    showRoles?: boolean;
    /**
     * Whether to show the users tab.
     * @default true
     */
    showUsers?: boolean;
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
    onRoleSelect?: (role: GuildRole) => void;
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
    showRoles = true,
    showUsers = true,
    botsOnly = false,
    excludedRoleIds,
    excludedUserIds,
    onRoleSelect,
    onUserSelect,
    class: className,
  }: Props = $props();

  let searchMode = $state<"users" | "roles">(defaultTab);
</script>

<Tabs.Root bind:value={searchMode} class={cn("h-full w-full max-w-xs", className)}>
  <Tabs.List>
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
