<script lang="ts">
  import { page } from "$app/state";
  import ChannelSelect from "$lib/components/discord/ChannelSelect.svelte";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import Mention from "$lib/components/discord/Mention.svelte";
  import type { DBGuildProjectionReturns } from "$lib/server/db";
  import { getManager } from "$lib/stores/GuildsManager.svelte";
  import { APIRoutes } from "$lib/urls";
  import apiClient from "$lib/utils/apiClient";
  import { Button, buttonVariants } from "$ui/button/index.js";
  import XIcon from "@lucide/svelte/icons/x";
  import * as Dialog from "$ui/dialog/index.js";
  import { Label } from "$ui/label";
  import * as Popover from "$ui/popover/index.js";
  import { Skeleton } from "$ui/skeleton";
  import { ChannelType } from "discord-api-types/v10";
  import { toast } from "svelte-sonner";

  type TicketConfig = DBGuildProjectionReturns["generalTicketSettings"];

  type Props = {
    forumId: string | null;
    oldCfg: TicketConfig | null;
    currentCfg: TicketConfig | null;
    loading: boolean;
  };
  let {
    forumId: fetchedForumId,
    oldCfg = $bindable(),
    currentCfg = $bindable(),
    loading = $bindable(),
  }: Props = $props();

  const guildsManager = getManager();
  let forum = $state<GuildCoreChannel | null>(null);
  let channelsLoaded = $derived(guildsManager.channelsLoaded);
  let channels = $derived(channelsLoaded ? guildsManager.channels : []);
  let newCategoryId = $state<string | null>(null);
  let categorySelectOpen = $state(false);
  let settingUp = $state(false);
  let dialogOpen = $state(false);

  async function setupFn() {
    try {
      settingUp = true;
      const res = await apiClient.post(APIRoutes.ticketSetup(page.params.guildid!), {
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

      const json = await res.json<TicketConfig>();

      oldCfg = { ...json };
      currentCfg = { ...json };
      fetchedForumId = json.forumId!;

      toast.success("Config updated");
    } catch (err: any) {
      toast.error("Setup failed.", {
        description: String(err.message ?? err),
      });
    } finally {
      settingUp = false;
      dialogOpen = false;
      newCategoryId = null;
    }
  }

  $effect(() => {
    if (channelsLoaded) {
      forum = channels.find((channel) => channel.id === fetchedForumId) || null;
    } else {
      forum = null;
    }
  });
</script>

<ConfigCard
  title="Ticket Forum"
  description="Configure the forum where tickets will be created."
  saveBtnDisabled={!forum}
  rootClass="col-span-full lg:col-span-3"
>
  <div class="flex flex-col gap-2">
    <Label>Ticket Forum</Label>
    {#if channelsLoaded}
      <div class="flex w-full items-center justify-between">
        <Mention channel={forum ?? undefined} buttons="copy" />
        <Dialog.Root
          bind:open={
            () => dialogOpen || settingUp,
            (v) => {
              if (settingUp) return;
              dialogOpen = v;
            }
          }
        >
          <Dialog.Trigger class={buttonVariants({ variant: "outline" })}>Setup New Forum</Dialog.Trigger>
          <Dialog.Content class="sm:max-w-130">
            <Dialog.Header>
              <Dialog.Title>Setup Ticket Forum</Dialog.Title>
              <Dialog.Description>
                The bot needs to setup the ticket forum by itself to avoid issues.
                <br />
                You can select a category where the forum will be created, but you can also leave it empty to let
                the bot create one for you.
              </Dialog.Description>
            </Dialog.Header>
            <div class="flex justify-center gap-2">
              {#if newCategoryId}
                {@const deleteHandler = () => {
                  newCategoryId = null;
                  return true;
                }}
                <Mention channelId={newCategoryId} buttons="copy" />
                <Button variant="destructive" size="icon-sm" onclick={deleteHandler}>
                  <XIcon class="size-4" />
                </Button>
              {:else}
                <Popover.Root bind:open={categorySelectOpen}>
                  <Popover.Trigger class={buttonVariants({ variant: "outline" })}>
                    Choose a category or leave empty
                  </Popover.Trigger>
                  <Popover.Content class="w-80">
                    <ChannelSelect
                      selectedId={newCategoryId || undefined}
                      selectCategories
                      channelTypes={[ChannelType.GuildCategory]}
                      onSelect={(c) => {
                        newCategoryId = c.id;
                        categorySelectOpen = false;
                      }}
                    />
                  </Popover.Content>
                </Popover.Root>
              {/if}
            </div>
            <Dialog.Footer>
              <Button showLoading={settingUp} disabled={settingUp} onclick={setupFn}>Setup</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Root>
      </div>
    {:else}
      <Skeleton class="h-8 w-full" />
    {/if}
  </div>
</ConfigCard>
