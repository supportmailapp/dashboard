<script lang="ts">
  import { page } from "$app/state";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import { APIRoutes } from "$lib/urls";
  import { cn, parseIconToURL } from "$lib/utils";
  import apiClient from "$lib/utils/apiClient";
  import { Button } from "$ui/button";
  import Input from "$ui/input/input.svelte";
  import Search from "@lucide/svelte/icons/search";
  import type { APIUser } from "discord-api-types/v10";
  import { toast } from "svelte-sonner";

  type Props = {
    botsOnly?: boolean;
    excludedUserIds?: string[];
    onSelect?: (user: APIUser) => void;
  };

  let { botsOnly = false, excludedUserIds, onSelect }: Props = $props();

  let loading = $state({ fetching: false });
  let fetchedUsers = $state<APIUser[]>([]);
  let userSearchInput = $state("");

  async function fetchUsers() {
    if (!userSearchInput) {
      toast.info("Search input empty!");
      return;
    }

    loading.fetching = true;

    try {
      const res = await apiClient.get<APIUser[]>(
        APIRoutes.memberSearch(page.params.guildid, userSearchInput, botsOnly ? "bot" : undefined),
      );

      const users = await res.json();
      fetchedUsers = excludedUserIds ? users.filter((user) => !excludedUserIds.includes(user.id)) : users;
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to fetch users");
    } finally {
      loading.fetching = false;
    }
  }

  function selectUser(user: APIUser) {
    return () => onSelect?.(user);
  }
</script>

<div class="flex flex-col gap-2">
  <form class="flex w-full flex-row gap-2" onsubmit={fetchUsers}>
    <Input
      bind:value={userSearchInput}
      placeholder={botsOnly ? "Bot username or ID" : "Username or ID"}
      class="h-9 grow"
      required
    />
    <Button
      type="submit"
      variant="default"
      class="h-9 px-3"
      disabled={loading.fetching}
      showLoading={loading.fetching}
    >
      <Search class="size-4" />
    </Button>
  </form>

  <div class={cn("flex flex-col gap-1", loading.fetching && "pointer-events-none opacity-70 select-none")}>
    <div class="flex max-h-[300px] min-h-20 w-full flex-col gap-1 overflow-y-auto rounded-md border p-2">
      {#if !fetchedUsers.length && !loading.fetching}
        <p class="bg-muted text-muted-foreground rounded-md p-3 text-center text-sm">
          {userSearchInput ? "No users found." : `Search for ${botsOnly ? "bots" : "users"} above.`}
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
