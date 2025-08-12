<script lang="ts">
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import Mention from "$lib/components/discord/Mention.svelte";
  import UserSelect from "$lib/components/UserSelect.svelte";
  import { buttonVariants } from "$ui/button";
  import { Label } from "$ui/label";
  import * as Popover from "$ui/popover/index.js";
  import { Switch } from "$ui/switch";
  import Plus from "@lucide/svelte/icons/plus";
  import type { APIUser } from "discord-api-types/v10";

  let { 
    allowedBots = $bindable(), 
    autoForward = $bindable(), 
    saveAllFn 
  }: { 
    allowedBots: string[]; 
    autoForward: boolean; 
    saveAllFn: SaveFunction 
  } = $props();

  const loading = $state({
    saving: false,
  });

  function addBot(user: APIUser) {
    if (!allowedBots.includes(user.id)) {
      allowedBots.push(user.id);
    }
  }
</script>

<ConfigCard
  rootClass="col-span-full lg:col-span-3"
  class="flex flex-col gap-6"
  title="Message Handling"
  description="Configure how messages are handled in tickets, including bot permissions and automatic forwarding."
  saveFn={async () => await saveAllFn((v: boolean) => (loading.saving = v))}
  saveBtnDisabled={loading.saving}
  saveBtnLoading={loading.saving}
>
  <div class="space-y-4">
    <div>
      <h4 class="text-sm font-medium mb-2">Automatic Forwarding</h4>
      <p class="text-sm text-muted-foreground mb-3">Messages in ticket posts are always forwarded to the user when enabled.</p>
      <Label>
        <Switch variant="success" bind:checked={autoForward} />
        Automatic Forwarding
      </Label>
    </div>

    <div>
      <h4 class="text-sm font-medium mb-2">Allowed Bots</h4>
      <p class="text-sm text-muted-foreground mb-3">Bots are usually ignored in ticket posts. Allow up to 5 bots that will not be ignored.</p>
      <div class="bg-input/30 border-input max-h-40 w-full overflow-y-auto rounded-md border p-3">
        {#each allowedBots as botId}
          <Mention
            userId={botId}
            onDelete={(bid) => {
              allowedBots = allowedBots.filter((id) => id !== bid);
              return true;
            }}
          />
        {/each}
        <Popover.Root>
          <Popover.Trigger
            class={buttonVariants({ variant: "outline", size: "icon", class: "size-7" })}
          >
            <Plus />
          </Popover.Trigger>
          <Popover.Content class="w-[400px]">
            <UserSelect botsOnly={true} excludedUserIds={allowedBots} onSelect={addBot} />
          </Popover.Content>
        </Popover.Root>
      </div>
    </div>
  </div>
</ConfigCard>
