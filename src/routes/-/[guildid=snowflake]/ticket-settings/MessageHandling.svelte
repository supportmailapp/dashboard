<script lang="ts">
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import Mention from "$lib/components/discord/Mention.svelte";
  import UserSelect from "$lib/components/discord/UserSelect.svelte";
  import { buttonVariants } from "$ui/button";
  import { Label } from "$ui/label";
  import * as Popover from "$ui/popover/index.js";
  import * as Field from "$ui/field/index.js";
  import Switch from "$ui/switch/switch.svelte";
  import Plus from "@lucide/svelte/icons/plus";
  import type { APIUser } from "discord-api-types/v10";
  import { Description } from "$ui/alert";

  let {
    allowedBots = $bindable(),
    autoForward = $bindable(),
  }: {
    allowedBots: string[];
    autoForward: boolean;
  } = $props();

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
>
  <Field.Group>
    <Field.Field orientation="horizontal">
      <Field.Content>
        <Field.Label>Automatic Forwarding</Field.Label>
        <Field.Description>
          Messages in ticket posts are always forwarded to the user when enabled.
        </Field.Description>
      </Field.Content>
      <Switch bind:checked={autoForward} />
    </Field.Field>

    <Field.Separator />

    <Field.Field orientation="vertical">
      <Field.Content>
        <Field.Label>Allowed Bots</Field.Label>
        <Field.Description>
          Bots are usually ignored in ticket posts. Allow up to 5 bots that will not be ignored.
        </Field.Description>
      </Field.Content>
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
          <Popover.Trigger class={buttonVariants({ variant: "outline", size: "icon", class: "size-7" })}>
            <Plus />
          </Popover.Trigger>
          <Popover.Content class="w-100">
            <UserSelect botsOnly={true} excludedUserIds={allowedBots} onSelect={addBot} />
          </Popover.Content>
        </Popover.Root>
      </div>
    </Field.Field>
  </Field.Group>
</ConfigCard>
