<script lang="ts">
  import Mention from "$lib/components/discord/Mention.svelte";
  import MentionableSelect from "$lib/components/discord/MentionableSelect.svelte";
  import { EntityType, type MentionableEntity } from "$lib/sm-types";
  import { buttonVariants } from "$ui/button";
  import * as Card from "$ui/card/index.js";
  import { Label } from "$ui/label";
  import * as Popover from "$ui/popover/index.js";
  import Plus from "@lucide/svelte/icons/plus";
  import type { APIUser } from "discord-api-types/v10";
  import equal from "fast-deep-equal/es6";

  type Props = {
    entities?: MentionableEntity[];
    loading?: boolean;
    title: string;
    /**
     * The text to display for the label of the input field.
     */
    labelText?: string;
    description?: string;
    notFoundText?: string;
    addButtonText?: string;
  };

  let {
    entities = $bindable(),
    loading = $bindable(),
    title,
    labelText,
    description = "Select users and roles",
  }: Props = $props();

  let popoverOpen = $state(false);
  let pingRoles = $derived((entities ?? []).filter((e) => e.typ === EntityType.role).map((e) => e.id));
  let pingUsers = $derived((entities ?? []).filter((e) => e.typ === EntityType.user).map((e) => e.id));

  function handlePingDelete(entityToRemove: MentionableEntity) {
    entities = (entities ?? []).filter((e) => !equal(e, entityToRemove)) ?? [];
    return true;
  }

  function handleRoleSelect(roleId: string) {
    if (!entities) {
      entities = [{ typ: EntityType.role, id: roleId }];
    } else {
      entities = [...entities, { typ: EntityType.role, id: roleId }];
    }
  }

  function handleUserSelect(user: APIUser) {
    if (entities) {
      if (!entities) {
        entities = [{ typ: EntityType.user, id: user.id }];
      } else {
        entities = [...entities, { typ: EntityType.user, id: user.id }];
      }
    }
  }
</script>

<Card.Root class="col-span-full lg:col-span-3">
  <Card.Header>
    <Card.Title>{title}</Card.Title>
    {#if description}
      <Card.Description>{description}</Card.Description>
    {/if}
  </Card.Header>
  <Card.Content class="space-y-2">
    {#if labelText}
      <Label>{labelText}</Label>
    {/if}
    <div class="bg-input/30 border-input max-h-40 w-full overflow-y-auto rounded-md border p-3">
      <div class="flex flex-wrap gap-2">
        {#each entities ?? [] as entity}
          <Mention
            class="w-max"
            userId={entity.typ === EntityType.user ? entity.id : undefined}
            roleId={entity.typ === EntityType.role ? entity.id : undefined}
            onDelete={() => handlePingDelete(entity)}
          />
        {/each}
        <Popover.Root bind:open={popoverOpen}>
          <Popover.Trigger
            class={buttonVariants({ variant: "outline", size: "icon", class: "size-7" })}
            disabled={!!loading}
          >
            <Plus class="size-4" />
          </Popover.Trigger>
          <Popover.Content>
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
  </Card.Content>
</Card.Root>
