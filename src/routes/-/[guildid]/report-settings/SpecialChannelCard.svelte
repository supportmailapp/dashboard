<script lang="ts">
  import * as Popover from "$ui/popover/index.js";
  import * as Field from "$ui/field/index.js";
  import * as Select from "$ui/select/index.js";
  import Mention from "$lib/components/discord/Mention.svelte";
  import { buttonVariants } from "$ui/button";
  import { ChannelType } from "discord-api-types/v10";
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import ChannelSelect from "$lib/components/discord/ChannelSelect.svelte";
  import { cn, extractSpecialChannelType } from "$lib/utils";
  import type { SpecialChannel } from "$lib/sm-types/src";
  import Plus from "@lucide/svelte/icons/plus";

  type Props = {
    setting: "IN" | "EX"; // IN = Include, EX = Exclude
    channels: SpecialChannel[];
    loading: boolean;
  };

  let { setting = $bindable(), channels = $bindable(), loading = $bindable() }: Props = $props();
</script>

<ConfigCard
  title="Special Channels"
  description="Select channels which are {setting === 'IN' ? 'included' : 'excluded'} from reports."
  rootClass="col-span-full lg:col-span-3"
  class={cn("flex flex-col items-start gap-2", loading && "pointer-events-none opacity-50")}
>
  <Field.Group>
    <Field.Field orientation="responsive">
      <Field.Content>
        <Field.Label>Channel Setting</Field.Label>
        <Field.Description>
          Select what happens to the selected channels in relation to reports.
        </Field.Description>
      </Field.Content>
      <Select.Root type="single" bind:value={setting}>
        <Select.Trigger class={buttonVariants({ variant: "outline" })} aria-label="Channel Setting">
          {setting === "IN" ? "Included" : "Excluded"}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="IN">Included</Select.Item>
          <Select.Item value="EX">Excluded</Select.Item>
        </Select.Content>
      </Select.Root>
    </Field.Field>
    <Field.Field>
      <div class="bg-input/30 border-input max-h-40 w-full overflow-y-auto rounded-md border p-3">
        <div class="flex flex-wrap gap-2">
          {#each channels ?? [] as channel}
            <Mention
              class="w-max"
              channelId={channel.id}
              onDelete={() => {
                channels = channels.filter((c) => c.id !== channel.id);
              }}
            />
          {/each}
          <Popover.Root>
            <Popover.Trigger
              class={buttonVariants({ variant: "outline", size: "icon", class: "size-7" })}
              disabled={!!loading}
            >
              <Plus class="size-4" />
            </Popover.Trigger>
            <Popover.Content class="w-80">
              <ChannelSelect
                selectCategories
                channelTypes={[
                  ChannelType.GuildCategory,
                  ChannelType.GuildText,
                  ChannelType.GuildAnnouncement,
                  ChannelType.GuildForum,
                  ChannelType.GuildVoice,
                  ChannelType.GuildStageVoice,
                ]}
                excludedChannelIds={channels.map((c) => c.id)}
                onSelect={(c) => {
                  channels = [...channels, { id: c.id, t: extractSpecialChannelType(c.type) }];
                }}
              />
            </Popover.Content>
          </Popover.Root>
        </div>
      </div>
    </Field.Field>
  </Field.Group>
  {#if setting === "IN"}
    <p class="text-warning text-sm">Reports can only be created in the selected channels.</p>
  {:else}
    <p class="text-warning text-sm">Reports cannot be created in the selected channels.</p>
  {/if}
</ConfigCard>
