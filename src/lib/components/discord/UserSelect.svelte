<script lang="ts">
  import { APIRoutes } from "$lib/urls.svelte";
  import { cn, parseIconToURL } from "$lib/utils.js";
  import apiClient from "$lib/utils/apiClient.js";
  import * as Avatar from "$ui/avatar/index.js";
  import { Button } from "$ui/button/index.js";
  import * as InputGroup from "$ui/input-group/index.js";
  import SearchIcon from "@lucide/svelte/icons/search";
  import type { APIUser } from "discord-api-types/v10";
  import { toast } from "svelte-sonner";
  import { Debounced, watch } from "runed";
  import LoadingSpinner from "../LoadingSpinner.svelte";
  import { users } from "$lib/stores/users.svelte";

  type Props = {
    botsOnly?: boolean;
    excludedUserIds?: string[];
    onSelect?: (user: APIUser) => void;
  };

  let { botsOnly = false, excludedUserIds, onSelect }: Props = $props();

  let loading = $state({ fetching: false });
  let fetchedUsers = $state<APIUser[]>([]);
  let userSearchInput = $state("");
  let debouncedSearch = new Debounced(() => userSearchInput, 500);

  async function fetchUsers() {
    if (!userSearchInput) {
      toast.info("Search input empty!");
      return;
    }

    if (/^\d+$/.test(userSearchInput)) {
      const cached = users.get(userSearchInput);
      if (cached) {
        fetchedUsers.unshift(cached);
      }
    }

    loading.fetching = true;

    try {
      const res = await apiClient.get<APIUser[]>(
        APIRoutes.memberSearch(userSearchInput, botsOnly ? "bot" : undefined),
      );

      const users = res.ok ? res.data : [];
      fetchedUsers = excludedUserIds ? users.filter((user) => !excludedUserIds.includes(user.id)) : users;
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to fetch users");
    } finally {
      loading.fetching = false;
    }
  }

  watch(
    () => debouncedSearch.current,
    (val) => {
      if (val) fetchUsers();
      else fetchedUsers = [];
    },
  );

  function selectUser(user: APIUser) {
    return () => onSelect?.(user);
  }
</script>

<div class="flex flex-col gap-2">
  <InputGroup.Root>
    <InputGroup.Input
      bind:value={userSearchInput}
      placeholder={botsOnly ? "Bot name or ID" : "Username or ID"}
      class="h-9 grow"
    />
    <InputGroup.Addon align="inline-start">
      <SearchIcon />
    </InputGroup.Addon>
  </InputGroup.Root>

  <div class={cn("flex flex-col gap-1", loading.fetching && "pointer-events-none opacity-70 select-none")}>
    <div class="flex max-h-75 w-full flex-col gap-1 overflow-y-auto rounded-md border p-2">
      {#if !fetchedUsers.length && !loading.fetching}
        <p class="text-muted-foreground p-3 text-center text-sm">
          {userSearchInput ? "No users found." : `Search for ${botsOnly ? "bots" : "users"}.`}
        </p>
      {:else if loading.fetching}
        <div class="flex justify-center p-4">
          <LoadingSpinner class="size-6" />
        </div>
      {:else}
        {#each fetchedUsers as user}
          <Button
            class="h-auto w-full max-w-xs items-center justify-start gap-2  p-2"
            size="default"
            variant="ghost"
            onclick={selectUser(user)}
          >
            <Avatar.Root class="size-8">
              <Avatar.Image
                src={parseIconToURL(user.avatar, user.id, "user", 64)}
                alt="User Avatar"
                class="rounded-full"
              />
              <Avatar.Fallback class="text-xs">{user.username.slice(0, 2).toUpperCase()}</Avatar.Fallback>
            </Avatar.Root>
            <div class="flex flex-col items-start">
              <p class="truncate font-medium">
                {user.global_name ?? user.username}
              </p>
              {#if user.global_name}
                <p class="text-muted-foreground truncate text-xs">@{user.username}</p>
              {/if}
            </div>
          </Button>
        {/each}
      {/if}
    </div>
  </div>
</div>
