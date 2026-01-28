<script lang="ts">
  import Mention from "$lib/components/discord/Mention.svelte";
  import MentionableSelect from "$lib/components/discord/MentionableSelect.svelte";
  import { EntityType, ReportNotificationType, type MentionableEntity } from "$lib/sm-types";
  import { buttonVariants } from "$ui/button";
  import * as Card from "$ui/card/index.js";
  import * as Field from "$ui/field/index.js";
  import * as Popover from "$ui/popover/index.js";
  import * as DropdownMenu from "$ui/dropdown-menu/index.js";
  import Plus from "@lucide/svelte/icons/plus";
  import type { APIUser } from "discord-api-types/v10";
  import equal from "fast-deep-equal/es6";
  import Check from "@lucide/svelte/icons/check";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import { cn } from "$lib/utils";

  type Props = {
    pings?: MentionableEntity[];
    notis?: ReportNotificationType[];
    loading?: boolean;
  };

  let { pings = $bindable(), notis = $bindable(), loading = $bindable() }: Props = $props();

  const notiItems = [
    {
      value: ReportNotificationType.ActionTaken,
      label: "Action Taken",
    },
    {
      value: ReportNotificationType.ReportSummary,
      label: "Report Summary",
    },
    {
      value: ReportNotificationType.ModeratorInfo,
      label: "Moderator Info",
    },
  ];

  let pingRoles = $derived((pings ?? []).filter((e) => e.typ === EntityType.role).map((e) => e.id));
  let pingUsers = $derived((pings ?? []).filter((e) => e.typ === EntityType.user).map((e) => e.id));

  function handlePingDelete(entityToRemove: MentionableEntity) {
    pings = (pings ?? []).filter((e) => !equal(e, entityToRemove)) ?? [];
    return true;
  }

  function handleRoleSelect(roleId: string) {
    if (!pings) {
      pings = [{ typ: EntityType.role, id: roleId }];
    } else {
      pings = [...pings, { typ: EntityType.role, id: roleId }];
    }
  }

  function handleUserSelect(user: APIUser) {
    if (pings) {
      if (!pings) {
        pings = [{ typ: EntityType.user, id: user.id }];
      } else {
        pings = [...pings, { typ: EntityType.user, id: user.id }];
      }
    }
  }

  function toggleNotificationType(notiType: ReportNotificationType) {
    if (!notis) {
      notis = [notiType];
    } else if (notis.includes(notiType)) {
      notis = notis.filter((n) => n !== notiType);
    } else {
      notis = [...notis, notiType];
    }
  }
</script>

<Card.Root class="col-span-full lg:col-span-3">
  <Card.Header>
    <Card.Title>Notification Settings</Card.Title>
    <Card.Description>Manage notifications</Card.Description>
  </Card.Header>
  <Card.Content class="space-y-2">
    <Field.Group>
      <Field.Field>
        <Field.Label>Pings</Field.Label>
        <Field.Description>Users and roles to ping when reports are created.</Field.Description>
        <div class="bg-input/30 border-input max-h-40 w-full overflow-y-auto rounded-md border p-3">
          <div class="flex flex-wrap gap-2">
            {#each pings ?? [] as entity}
              <Mention
                class="w-max"
                userId={entity.typ === EntityType.user ? entity.id : undefined}
                roleId={entity.typ === EntityType.role ? entity.id : undefined}
                onDelete={() => handlePingDelete(entity)}
              />
            {/each}
            <Popover.Root>
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
      </Field.Field>

      <Field.Field orientation="responsive">
        <Field.Content>
          <Field.Label>User Notifications</Field.Label>
          <Field.Description>Data sent to the user who created a report.</Field.Description>
        </Field.Content>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            class={cn(
              "border-input data-placeholder:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none select-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
              "w-full sm:w-fit",
            )}
            disabled={loading}
          >
            Select Notification Types
            <ChevronDown class="size-4 opacity-50" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content class="w-50">
            <DropdownMenu.Group>
              {#each notiItems as notiItem}
                <DropdownMenu.Item
                  closeOnSelect={false}
                  onclick={() => toggleNotificationType(notiItem.value)}
                >
                  {#if notis?.includes(notiItem.value)}
                    <span class="absolute right-2 flex size-3.5 items-center justify-center">
                      <Check class="size-4" />
                    </span>
                  {/if}
                  {notiItem.label}
                </DropdownMenu.Item>
              {/each}
            </DropdownMenu.Group>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Field.Field>
    </Field.Group>
  </Card.Content>
</Card.Root>
