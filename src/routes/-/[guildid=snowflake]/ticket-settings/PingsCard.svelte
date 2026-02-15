<script lang="ts">
  import ConfigCard from "$lib/components/ConfigCard.svelte";
  import Switch from "$ui/switch/switch.svelte";
  import * as Field from "$ui/field/index.js";
  import * as Popover from "$ui/popover/index.js";
  import { EntityType, type MentionableEntity } from "$lib/sm-types/src";
  import equal from "fast-deep-equal/es6";
  import type { APIUser } from "discord-api-types/v10";
  import Mention from "$lib/components/discord/Mention.svelte";
  import { buttonVariants } from "$ui/button";
  import Plus from "@lucide/svelte/icons/plus";
  import MentionableSelect from "$lib/components/discord/MentionableSelect.svelte";

  let { pings = $bindable() }: { pings: MentionableEntity[] } = $props();

  let pingRoles = $derived(pings.filter((e) => e.typ === EntityType.role).map((e) => e.id));
  let pingUsers = $derived(pings.filter((e) => e.typ === EntityType.user).map((e) => e.id));

  function handlePingDelete(entityToRemove: MentionableEntity) {
    pings = (pings ?? []).filter((e) => !equal(e, entityToRemove));
  }

  function handleRoleSelect(roleId: string) {
    pings = [...pings, { typ: EntityType.role, id: roleId }];
  }

  function handleUserSelect(user: APIUser) {
    pings = [...pings, { typ: EntityType.user, id: user.id }];
  }
</script>

<ConfigCard
  rootClass="col-span-full lg:col-span-3"
  title="Notification Settings"
  description="Configure who gets pinged when tickets are created."
  class="space-y-2"
>
  <div class="bg-input/30 border-input max-h-40 min-h-20 w-full overflow-y-auto rounded-md border p-3">
    <div class="flex flex-wrap gap-2">
      {#each pings ?? [] as entity}
        <Mention
          userId={entity.typ === EntityType.user ? entity.id : undefined}
          roleId={entity.typ === EntityType.role ? entity.id : undefined}
          onDelete={() => handlePingDelete(entity)}
        />
      {/each}
      <Popover.Root>
        <Popover.Trigger class={buttonVariants({ variant: "outline", size: "icon", class: "size-7" })}>
          <Plus />
        </Popover.Trigger>
        <Popover.Content class="w-80">
          <MentionableSelect
            excludedRoleIds={pingRoles}
            excludedUserIds={pingUsers}
            onRoleSelect={handleRoleSelect}
            onUserSelect={handleUserSelect}
          />
        </Popover.Content>
      </Popover.Root>
    </div>
  </div>
</ConfigCard>
