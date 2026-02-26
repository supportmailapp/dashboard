<script lang="ts">
  import Mention from "$lib/components/discord/Mention.svelte";
  import type { APIAllowedMentions } from "$lib/sm-types/src/utils/validators";
  import { buttonVariants } from "$ui/button";
  import * as Dialog from "$ui/dialog/index";
  import * as Field from "$ui/field/index";
  import * as Select from "$ui/select/index";
  import * as Popover from "$ui/popover/index";
  import Switch from "$ui/switch/switch.svelte";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Plus from "@lucide/svelte/icons/plus";
  import RoleSelect from "$lib/components/discord/RoleSelect.svelte";
  import UserSelect from "$lib/components/discord/UserSelect.svelte";
  import { users } from "$lib/stores/users.svelte";

  let {
    open = $bindable(false),
    allowedMentions = $bindable(),
  }: {
    open: boolean;
    allowedMentions: APIAllowedMentions;
  } = $props();

  const mentionModeLabels = {
    roles: {
      all: "Automatic",
      specific: "Specific Roles",
      none: "None",
    },
    users: {
      all: "Automatic",
      specific: "Specific Users",
      none: "None",
    },
  };
</script>

<Dialog.Root>
  <Dialog.Trigger class={buttonVariants({ variant: "default" })}>
    <Pencil />
    Edit Allowed Mentions
  </Dialog.Trigger>
  <Dialog.Content>
    <Field.Group>
      <Field.Field>
        <Field.Label>Role Mentions</Field.Label>
        <Field.Description>Set roles that can be mentioned when sending the panel message.</Field.Description>
        <Select.Root type="single" bind:value={allowedMentions.roleMode}>
          <Select.Trigger class="w-full">
            {mentionModeLabels.roles[allowedMentions.roleMode]}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="none">{mentionModeLabels.roles.none}</Select.Item>
            <Select.Item value="all">{mentionModeLabels.roles.all}</Select.Item>
            <Select.Item value="specific">{mentionModeLabels.roles.specific}</Select.Item>
          </Select.Content>
        </Select.Root>

        {#if allowedMentions.roleMode === "specific"}
          <div
            class="bg-input/30 border-input max-h-40 min-h-20 w-full overflow-y-auto rounded-md border p-3"
          >
            <div class="flex flex-wrap gap-2">
              {#each allowedMentions.roles as roleId}
                <Mention
                  {roleId}
                  onDelete={() =>
                    (allowedMentions.roles = allowedMentions.roles!.filter((id) => id !== roleId))}
                />
              {/each}
              <Popover.Root>
                <Popover.Trigger
                  class={buttonVariants({ variant: "outline", size: "icon", class: "size-7" })}
                >
                  <Plus />
                </Popover.Trigger>
                <Popover.Content class="w-80">
                  <RoleSelect
                    excludedRoleIds={allowedMentions.roles ?? []}
                    bots={false}
                    onSelect={(roleId) => {
                      if (!allowedMentions.roles?.includes(roleId)) {
                        allowedMentions.roles = [...(allowedMentions.roles ?? []), roleId];
                      }
                    }}
                  />
                </Popover.Content>
              </Popover.Root>
            </div>
          </div>
        {/if}
      </Field.Field>

      <Field.Field>
        <Field.Label>User Mentions</Field.Label>
        <Field.Description>Set users that can be mentioned when sending the panel message.</Field.Description>
        <Select.Root type="single" bind:value={allowedMentions.userMode}>
          <Select.Trigger class="w-full">
            {mentionModeLabels.users[allowedMentions.userMode]}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="none">{mentionModeLabels.users.none}</Select.Item>
            <Select.Item value="all">{mentionModeLabels.users.all}</Select.Item>
            <Select.Item value="specific">{mentionModeLabels.users.specific}</Select.Item>
          </Select.Content>
        </Select.Root>

        {#if allowedMentions.userMode === "specific"}
          <div
            class="bg-input/30 border-input max-h-40 min-h-20 w-full overflow-y-auto rounded-md border p-3"
          >
            <div class="flex flex-wrap gap-2">
              {#each allowedMentions.users as userId}
                <Mention
                  {userId}
                  onDelete={() =>
                    (allowedMentions.users = allowedMentions.users!.filter((id) => id !== userId))}
                />
              {/each}
              <Popover.Root>
                <Popover.Trigger
                  class={buttonVariants({ variant: "outline", size: "icon", class: "size-7" })}
                >
                  <Plus />
                </Popover.Trigger>
                <Popover.Content class="w-80">
                  <UserSelect
                    excludedUserIds={allowedMentions.users ?? []}
                    onSelect={(user) => {
                      users.set(user.id, user);
                      if (!allowedMentions.users?.includes(user.id)) {
                        allowedMentions.users = [...(allowedMentions.users ?? []), user.id];
                      }
                    }}
                  />
                </Popover.Content>
              </Popover.Root>
            </div>
          </div>
        {/if}
      </Field.Field>

      <Field.Separator />

      <Field.Field orientation="horizontal">
        <Field.Label>Allow @everyone/@here</Field.Label>
        <Switch bind:checked={() => !!allowedMentions.everyone, (v) => (allowedMentions.everyone = v)} />
      </Field.Field>
    </Field.Group>
  </Dialog.Content>
</Dialog.Root>
