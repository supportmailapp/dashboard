<script lang="ts">
  import equal from "fast-deep-equal/es6";
  import { EntityType, type MentionableEntity } from "supportmail-types";
  import * as Card from "$ui/card/index.js";
  import * as Popover from "$ui/popover/index.js";
  import { Label } from "$ui/label";
  import Mention from "$lib/components/discord/Mention.svelte";
  import { Button, buttonVariants } from "$ui/button";
  import Plus from "@lucide/svelte/icons/plus";
  import MentionableSelect from "$lib/components/MentionableSelect.svelte";
  import type { APIRole, APIUser } from "discord-api-types/v10";
  import Save from "@lucide/svelte/icons/save";
  import { MarkdownFormatter } from "$lib/utils/formatting";

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
    saveFn: SaveFunction;
  };

  let {
    entities = $bindable(),
    loading = $bindable(),
    title,
    labelText,
    description = "Select users and roles",
    notFoundText = "Nothing configured yet.",
    addButtonText = "Add Entity",
    saveFn,
  }: Props = $props();

  let pingRoles = $derived((entities ?? []).filter((e) => e.typ === EntityType.role).map((e) => e.id));
  let pingUsers = $derived((entities ?? []).filter((e) => e.typ === EntityType.user).map((e) => e.id));

  function handlePingDelete(entityToRemove: MentionableEntity) {
    entities = (entities ?? []).filter((e) => !equal(e, entityToRemove)) ?? [];
    return true;
  }

  function handleRoleSelect(role: APIRole) {
    if (!entities) {
      entities = [{ typ: EntityType.role, id: role.id }];
    } else {
      entities = [...entities, { typ: EntityType.role, id: role.id }];
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

<Card.Root>
  <Card.Header>
    <Card.Title>{title}</Card.Title>
    {#if description}
      <Card.Description>{@html new MarkdownFormatter(description).toHTML()}</Card.Description>
    {/if}
  </Card.Header>
  <Card.Content class="space-y-2">
    {#if labelText}
      <Label>{labelText}</Label>
    {/if}
    <div class="bg-accent/50 max-h-40 min-h-20 w-full overflow-y-auto rounded-md border p-3">
      {#if (entities ?? []).length === 0}
        <p class="text-muted-foreground text-sm">{notFoundText}</p>
      {:else}
        <div class="flex flex-wrap gap-2">
          {#each entities ?? [] as entity}
            <Mention
              class="w-max"
              userId={entity.typ === EntityType.user ? entity.id : undefined}
              roleId={entity.typ === EntityType.role ? entity.id : undefined}
              onDelete={() => handlePingDelete(entity)}
            />
          {/each}
        </div>
      {/if}

      <div class="mt-2">
        <Popover.Root>
          <Popover.Trigger
            class={buttonVariants({
              variant: "outline",
              size: "sm",
              class: "h-8",
            })}
            disabled={!!loading}
          >
            <Plus class="mr-2 h-4 w-4" />
            {addButtonText}
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
  </Card.Content>
  <Card.Footer class="justify-end">
    <Button
      variant="default"
      disabled={loading}
      showLoading={loading}
      class="w-[100px]"
      onclick={async () => {
        await saveFn((v) => (loading = v));
      }}
    >
      <Save class="mr-0.5 size-4" />
      Save
    </Button>
  </Card.Footer>
</Card.Root>
