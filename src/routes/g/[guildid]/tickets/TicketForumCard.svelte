<script lang="ts">
  import { page } from "$app/state";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import ChannelSelect from "$lib/components/ChannelSelect.svelte";
  import * as Alert from "$lib/components/ui/alert/index.js";
  import { Skeleton } from "$ui/skeleton";
  import { ChannelType } from "discord-api-types/v10";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Button, buttonVariants } from "$ui/button/index.js";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import Mention from "$lib/components/discord/Mention.svelte";
  import { APIRoutes } from "$lib/urls";
  import apiClient from "$lib/utils/apiClient";
  import { toast } from "svelte-sonner";
  import type { DBGuildProjectionReturns } from "$lib/server/db";

  let {
    forumId: fetchedForumId,
    wholeConfig,
  }: { forumId: string | null; wholeConfig: ConfigState<DBGuildProjectionReturns["generalTicketSettings"]> } =
    $props();

  const forum = new ConfigState<GuildCoreChannel>(null);
  let channelsLoaded = $derived(page.data.guildsManager.channelsLoaded);
  let channels = $derived(channelsLoaded ? page.data.guildsManager.channels! : []);
  let newCategoryId = $state<string | null>(null);
  let newCategory = $derived<GuildCoreChannel | undefined>(
    newCategoryId ? (channels.find((c) => c.id === newCategoryId) ?? undefined) : undefined,
  );
  let categorySelectOpen = $state(false);

  async function setupFn() {
    try {
      const res = await apiClient.post(APIRoutes.ticketSetup(page.data.guildId!), {
        json: {
          categoryId: newCategoryId,
        },
      });

      if (!res.ok) {
        const errJson = await res.json<any>();
        const errText = errJson?.message || "Unknown Error";
        throw new Error(errText);
      }

      toast.info("Setup in progress", { description: "This may take a few seconds" });

      const json = await res.json<DBGuildProjectionReturns["generalTicketSettings"]>();

      wholeConfig.saveConfig(json);
      fetchedForumId = json.forumId!;

      toast.success("Config updated, refresh needed");
    } catch (err: any) {
      toast.error("Setup failed.", {
        description: String(err.message ?? err),
      });
    }
  }

  $effect(() => {
    if (channelsLoaded) {
      forum.setConfig(channels.find((channel) => channel.id === fetchedForumId) || null);
    } else {
      forum.clear();
    }
  });

  $effect(() => {
    if (forum.loading) {
    }
  });
</script>

<ConfigCard title="Ticket Forum" description="Configure the forum where tickets will be created.">
  <div class="flex flex-col gap-2">
    {#if channelsLoaded && forum.isConfigured()}
      <div class="flex w-full items-center justify-between">
        <Mention channel={forum.config ?? undefined} fallback="c" buttons="copy" />
        <Button
          variant="destructive"
          onclick={() => {
            // TODO: This is jsut a placeholder, implement actual deletion logic
            fetchedForumId = null;
            forum.setConfig(null);
          }}
        >
          Reset
        </Button>
      </div>
    {:else if !channelsLoaded}
      <Skeleton class="h-8 w-full" />
    {:else}
      <div class="flex w-full flex-col">
        <Alert.Root variant="warning" class="w-full">
          <Alert.Title>No forum set.</Alert.Title>
          <Alert.Description>Click the button below to start the setup.</Alert.Description>
        </Alert.Root>

        <div class="mt-4 grid grid-cols-1 place-items-start gap-5 p-3 md:grid-cols-[auto_1fr]">
          <div class="flex w-fit max-w-3xs flex-col items-center gap-2">
            {#if newCategoryId}
              <Mention
                channel={newCategory}
                fallback="c"
                onDelete={() => {
                  newCategoryId = null;
                  return true;
                }}
              />
            {:else}
              <span class="text-muted-foreground bg-muted rounded px-2 py-1 text-sm">
                No category selected
              </span>
            {/if}
            <Popover.Root bind:open={categorySelectOpen}>
              <Popover.Trigger class={buttonVariants({ variant: "outline" })}>
                Choose a category
              </Popover.Trigger>
              <Popover.Content class="w-80">
                <ChannelSelect
                  selected={newCategory}
                  channelTypes={[ChannelType.GuildCategory]}
                  selectCategories
                  onSelect={(c) => {
                    newCategoryId = c.id;
                    categorySelectOpen = false;
                  }}
                />
              </Popover.Content>
            </Popover.Root>
          </div>
          <p class="text-sm">
            The bot needs to setup the ticket forum by itself to avoid issues.<br />
            You can select a category where the forum will be created, but you can also leave it empty to let the
            bot create one for you.
          </p>
        </div>
        <Button onclick={setupFn}>Setup</Button>
      </div>
    {/if}
  </div>
</ConfigCard>
