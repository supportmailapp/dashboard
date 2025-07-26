<script lang="ts">
  import Mention from "$lib/components/discord/Mention.svelte";
  import MentionableSelect from "$lib/components/MentionableSelect.svelte";
  import { cn } from "$lib/utils";
  import { Button, buttonVariants } from "$ui/button";
  import * as Dialog from "$ui/dialog/index.js";
  import { Input } from "$ui/input";
  import { Label } from "$ui/label";
  import { ScrollArea } from "$ui/scroll-area";
  import { Switch } from "$ui/switch";
  import * as Popover from "$ui/popover/index.js";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import Trash from "@lucide/svelte/icons/trash";
  import { EntityType, type ITicketCategory } from "supportmail-types";
  import Plus from "@lucide/svelte/icons/plus";
  import equal from "fast-deep-equal/es6";

  let {
    category = $bindable(),
    onDelete,
    onSave,
  }: {
    category: DocumentWithId<ITicketCategory>;
    onDelete: (category_id: string) => void;
    onSave: (category_id: string) => Promise<void>;
  } = $props();

  const labelIsValid = $derived(category.label.length >= 3 && category.label.length <= 45);
  const pingUsers = $derived(category.pings?.filter((e) => e.typ === EntityType.user).map((e) => e.id) ?? []);
  const pingRoles = $derived(category.pings?.filter((e) => e.typ === EntityType.role).map((e) => e.id) ?? []);

  $inspect("pings", category.pings);

  let open = $state(false);
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger class={buttonVariants({ variant: "outline", class: "w-full", size: "2xl" })}>
    {category.label}
    <ChevronRight class="ml-auto" />
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Edit Category</Dialog.Title>
    </Dialog.Header>

    <div class="flex w-full max-w-sm flex-col gap-1.5">
      <Label for="cat-enabled">Status</Label>
      <Switch bind:checked={category.enabled} id="cat-enabled" />
    </div>

    <div class="flex w-full max-w-sm flex-col gap-1.5">
      <Label for="cat-label">Name</Label>
      <Input
        bind:value={category.label}
        class={cn(
          !labelIsValid
            ? "border-destructive-foreground ring-destructive-foreground"
            : "border-success-foreground ring-success-foreground",
        )}
        type="text"
        autocomplete="off"
        id="cat-label"
        placeholder="Support, Bug, etc."
        minlength={3}
        maxlength={45}
        aria-invalid={!labelIsValid}
      />
    </div>

    <div
      class="bg-accent flex max-h-50 w-full max-w-sm flex-wrap items-center gap-1 overflow-y-auto rounded-md border p-2"
    >
      {#each category.pings ?? [] as entity}
        <Mention
          class="w-max"
          userId={entity.typ === EntityType.user ? entity.id : undefined}
          roleId={entity.typ === EntityType.role ? entity.id : undefined}
          onDelete={() => {
            category.pings = (category.pings ?? []).filter((e) => !equal(e, entity));
            return true;
          }}
        />
      {/each}
      <Popover.Root>
        <Popover.Trigger
          class={buttonVariants({ variant: "outline", size: "icon", class: "aspect-square size-7" })}
        >
          <Plus />
        </Popover.Trigger>
        <Popover.Content class="h-90 w-xs">
          <MentionableSelect
            excludedRoleIds={pingRoles}
            excludedUserIds={pingUsers}
            onRoleSelect={(role) => {
              if (!category.pings) {
                category.pings = [{ typ: EntityType.role, id: role.id }];
              } else {
                category.pings.push({ typ: EntityType.role, id: role.id });
              }
            }}
            onUserSelect={(user) => {
              if (!category.pings) {
                category.pings = [{ typ: EntityType.user, id: user.id }];
              } else {
                category.pings.push({ typ: EntityType.user, id: user.id });
              }
            }}
          />
        </Popover.Content>
      </Popover.Root>
    </div>

    <Dialog.Footer class="grid grid-cols-2">
      <Button variant="destructive" onclick={() => onDelete(category._id)}>
        <Trash />
      </Button>
      <Button onclick={() => onSave(category._id)}>Save</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
