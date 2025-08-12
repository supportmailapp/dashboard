<script lang="ts">
  import { page } from "$app/state";
  import ChannelSelect from "$lib/components/ChannelSelect.svelte";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import Mention from "$lib/components/discord/Mention.svelte";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import type { DBGuildProjectionReturns } from "$lib/server/db";
  import { ConfigState } from "$lib/stores/ConfigState.svelte";
  import { APIRoutes } from "$lib/urls";
  import apiClient from "$lib/utils/apiClient";
  import { Button, buttonVariants } from "$ui/button/index.js";
  import * as Card from "$ui/card";
  import { Label } from "$ui/label";
  import { Separator } from "$ui/separator";
  import { Skeleton } from "$ui/skeleton";
  import { Switch } from "$ui/switch";
  import { ChannelType } from "discord-api-types/v10";
  import { toast } from "svelte-sonner";

  type Props = {
    forumId: string | null;
    wholeConfig: ConfigState<DBGuildProjectionReturns["generalTicketSettings"]>;
    saveAllFn: SaveFunction;
  };
  let { forumId: fetchedForumId, wholeConfig, saveAllFn }: Props = $props();

  const forum = new ConfigState<GuildCoreChannel>(null);
  let channelsLoaded = $derived(page.data.guildsManager.channelsLoaded);
  let channels = $derived(channelsLoaded ? page.data.guildsManager.channels! : []);
  let newCategoryId = $state<string | null>(null);
  let newCategory = $derived<GuildCoreChannel | undefined>(
    newCategoryId ? (channels.find((c) => c.id === newCategoryId) ?? undefined) : undefined,
  );
  let categorySelectOpen = $state(false);
  let loading = $state({
    setup: false,
    saving: false,
  });

  $inspect("fetchedForumId", fetchedForumId);

  async function setupFn() {
    try {
      loading.setup = true;
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

      toast.success("Config updated");
    } catch (err: any) {
      toast.error("Setup failed.", {
        description: String(err.message ?? err),
      });
    } finally {
      loading.setup = false;
    }
  }

  $effect(() => {
    if (channelsLoaded) {
      forum.setConfig(channels.find((channel) => channel.id === fetchedForumId) || null);
    } else {
      forum.clear();
    }
  });
</script>

<ConfigCard
  title="Ticket Forum"
  description="Configure the forum where tickets will be created."
  saveBtnDisabled={!forum.config}
  rootClass="col-span-full lg:col-span-3"
>
  <div class="flex flex-col gap-2">
    <Label>Ticket Forum</Label>
    {#if channelsLoaded}
      <div class="flex w-full items-center justify-between">
        <Mention channel={forum.config ?? undefined} fallback buttons="copy" />
        <Dialog.Root>
          <Dialog.Trigger class={buttonVariants({ variant: "outline" })}>Setup New Forum</Dialog.Trigger>
          <Dialog.Content class="sm:max-w-[525px]">
            <Dialog.Header>
              <Dialog.Title>Setup Ticket Forum</Dialog.Title>
              <Dialog.Description>
                The bot needs to setup the ticket forum by itself to avoid issues.
                <br />
                You can select a category where the forum will be created, but you can also leave it empty to let
                the bot create one for you.
              </Dialog.Description>
            </Dialog.Header>
            <div class="grid grid-cols-[1fr_auto] gap-2">
              {#if newCategoryId}
                {@const deleteHandler = () => {
                  newCategoryId = null;
                  return true;
                }}
                <Mention channel={newCategory} fallback onDelete={deleteHandler} />
                <Button
                  variant="destructive"
                  class={buttonVariants({ variant: "destructive" })}
                  onclick={deleteHandler}
                >
                  Clear
                </Button>
              {:else}
                <span class="text-muted-foreground bg-muted col-span-2 rounded-lg px-3 py-2 text-sm">
                  No category selected
                </span>
              {/if}
            </div>
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

            <Dialog.Footer>
              <Button
                showLoading={loading.setup}
                disabled={loading.setup}
                onclick={setupFn}
              >
                Setup
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Root>
      </div>
    {:else}
      <Skeleton class="h-8 w-full" />
    {/if}
  </div>
</ConfigCard>