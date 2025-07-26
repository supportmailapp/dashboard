<script lang="ts">
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import Mention from "$lib/components/discord/Mention.svelte";
  import * as Popover from "$ui/popover/index.js";
  import type { DBGuildProjectionReturns } from "$lib/server/db";
  import { Button, buttonVariants } from "$ui/button";
  import Plus from "@lucide/svelte/icons/plus";
  import Input from "$ui/input/input.svelte";
  import type { APIGuildMember, APIUser } from "discord-api-types/v10";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import { cn, parseIconToURL } from "$lib/utils";
  import Search from "@lucide/svelte/icons/search";
  import { toast } from "svelte-sonner";
  import apiClient from "$lib/utils/apiClient";
  import { APIRoutes } from "$lib/urls";
  import { page } from "$app/state";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";

  let { allowedBots = $bindable(), saveAllFn }: { allowedBots: string[]; saveAllFn: SaveFunction } = $props();

  let oldConfig = $state($state.snapshot(allowedBots) ?? []);
  const loading = $state({
    saving: false,
    fetching: false,
  });
  let fetchedUsers = $state<APIUser[]>([]);
  let userSearchInput = $state("");

  async function fetchUsers() {
    if (!userSearchInput) {
      toast.info("Seach Input empty!");
      return;
    }

    loading.fetching = true;

    try {
      const res = await apiClient.get<APIUser[]>(
        APIRoutes.memberSearch(page.params.guildid, userSearchInput, "bot"),
      );

      fetchedUsers = await res.json();
    } catch (err: any) {
      console.error(err);
    } finally {
      loading.fetching = false;
    }
  }

  function addBot(id: string) {
    return () => {
      allowedBots.push(id);
    };
  }

  $inspect("oldConfig", oldConfig);
  $inspect("current allowedBots", allowedBots);
</script>

<ConfigCard
  class="flex flex-col gap-4"
  title="Allowed Bots"
  description="Bots are usually ignored in ticket posts. This allows you to allow up to 5 bots that will not be ignored."
  saveFn={async () =>
    await saveAllFn(
      (v: boolean) => (loading.saving = v),
      (data: DBGuildProjectionReturns["generalTicketSettings"]) => {
        oldConfig = data.allowedBots ?? [];
      },
    )}
  saveBtnDisabled={loading.saving}
  saveBtnLoading={loading.saving}
>
  <div class="bg-accent flex flex-row rounded-md p-2 gap-1">
    {#each allowedBots as botId}
      <Mention
        userId={botId}
        onDelete={(bid) => {
          allowedBots = allowedBots.filter((id) => id !== bid);
          return true;
        }}
      />
    {/each}
    <Popover.Root
      onOpenChange={(isOpening) => {
        if (!isOpening) {
          fetchedUsers = [];
        }
      }}
    >
      <Popover.Trigger
        class={buttonVariants({ variant: "outline", size: "icon", class: "aspect-square size-7" })}
      >
        <Plus />
      </Popover.Trigger>
      <Popover.Content class="max-w-[250px]">
        <div
          class={cn("flex flex-col gap-1", loading.fetching && "pointer-events-none opacity-70 select-none")}
        >
          <form class="flex w-full flex-row gap-1" onsubmit={fetchUsers}>
            <Input bind:value={userSearchInput} placeholder="Username or ID" class="h-8 grow" required />
            <Button
              type="submit"
              variant="default"
              class="size-8"
              disabled={loading.fetching}
              showLoading={loading.fetching}
            >
              <Search />
            </Button>
          </form>
          <div class="flex max-h-[300px] min-h-10 w-full flex-col gap-1 overflow-y-auto">
            {#if !fetchedUsers.length && !loading.fetching}
              <p class="bg-muted text-muted-foreground rounded-md p-2 text-sm">No users found.</p>
            {:else if loading.fetching}
              <LoadingSpinner class="size-6" />
            {:else}
              {#each fetchedUsers as user}
                <Button
                  class="w-full items-center justify-start"
                  size="default"
                  variant="ghost"
                  onclick={addBot(user.id)}
                >
                  <Avatar.Root>
                    <Avatar.Image
                      src={parseIconToURL(user.avatar, user.id, "user", 128)}
                      alt="User Avatar"
                      class="rounded-full"
                    />
                    <Avatar.Fallback>{user.username.toUpperCase()}</Avatar.Fallback>
                  </Avatar.Root>
                  <p class="truncate">
                    {user.global_name ?? user.username}
                  </p>
                </Button>
              {/each}
            {/if}
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
  </div>
</ConfigCard>
