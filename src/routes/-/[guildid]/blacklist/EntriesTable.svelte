<script lang="ts">
  import type { APIBlacklistEntry } from "../../../api/v1/guilds/[guildid]/blacklist/+server";
  import Mention from "$lib/components/discord/Mention.svelte";
  import { EntityType, BlacklistScope } from "$lib/sm-types";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { cn } from "$lib/utils";
  import { Button } from "$ui/button";
  import * as Dialog from "$ui/dialog/index.js";
  import * as Dropdown from "$ui/dropdown-menu/index.js";
  import * as Table from "$ui/table/index.js";
  import Label from "$ui/label/label.svelte";
  import Check from "@lucide/svelte/icons/check";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import Pencil from "@lucide/svelte/icons/pencil";
  import Trash from "@lucide/svelte/icons/trash";
  import { toast } from "svelte-sonner";
  import { BLEntry, dialogFields, toggleScope } from "./entry.svelte";
  import { SvelteBitfield } from "$lib/utils/reactiveBitfield.svelte";
  import AreYouSureDialog from "$lib/components/AreYouSureDialog.svelte";
  import type { SvelteSet } from "svelte/reactivity";
  import Checkbox from "$ui/checkbox/checkbox.svelte";

  interface Props {
    entries: APIBlacklistEntry[];
    pageStatus: "loading" | "loaded" | "error";
    saveEntry: (entry: BLEntry) => Promise<void>;
    deleteEntry: (entryId: string) => Promise<void>;
    toggleSelectedRow: (_id: string, selected: boolean) => void;
    selectedRows: string[];
  }

  let {
    entries,
    pageStatus = $bindable(),
    saveEntry,
    deleteEntry,
    toggleSelectedRow,
    selectedRows,
  }: Props = $props();

  let deleteConfirmDialog = $state<string | null>(null);
  let editEntry = new BLEntry();

  function getScopeNames(scopesBigint: string): string[] {
    const bitfield = new SvelteBitfield(BigInt(scopesBigint));
    return Object.entries(BlacklistScope)
      .filter(([key, value]) => typeof value === "number" && bitfield.has(value))
      .map(([key]) => key);
  }
</script>

{#if pageStatus === "loaded"}
  {#key entries}
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-10"></Table.Head>
          <Table.Head class="w-25">Type</Table.Head>
          <Table.Head>Entity</Table.Head>
          <Table.Head>Scopes</Table.Head>
          <Table.Head class="text-end">Actions</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each entries as entry (entry.id)}
          {@const isSelected = !!selectedRows.find((id) => id === entry._id)}
          <Table.Row class={cn(isSelected && "bg-destructive/20")}>
            <Table.Cell>
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => {
                  toggleSelectedRow(entry._id, checked);
                }}
              />
            </Table.Cell>
            <Table.Cell class="font-medium">
              {entry._type === EntityType.user ? "User" : "Role"}
            </Table.Cell>
            <Table.Cell>
              <Mention
                userId={entry._type === EntityType.user ? entry.id : undefined}
                roleId={entry._type === EntityType.role ? entry.id : undefined}
                buttons="copy"
              />
            </Table.Cell>
            <Table.Cell>
              {#each getScopeNames(entry.scopes) as scopeName}
                <span
                  class={cn(
                    "inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary",
                    "mr-1 last:mr-0",
                  )}
                >
                  {scopeName.charAt(0).toUpperCase() + scopeName.slice(1)}
                </span>
              {/each}
            </Table.Cell>
            <Table.Cell class="text-end">
              <div class="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onclick={() => {
                    editEntry.id = entry.id;
                    editEntry.type = entry._type;
                    editEntry.scopes.bits = BigInt(entry.scopes);
                    editEntry.dialogOpen = true;
                  }}
                >
                  <Pencil class="size-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onclick={() => {
                    deleteConfirmDialog = entry._id;
                  }}
                >
                  <Trash class="size-4" />
                </Button>
              </div>
            </Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={4} class="text-center text-muted-foreground">
              No entries found
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  {/key}
{:else if pageStatus === "loading"}
  <LoadingSpinner class="mx-auto my-4 size-20" />
{:else if pageStatus === "error"}
  <div class="text-red-500">Error loading entries</div>
{/if}

<AreYouSureDialog
  title="Are you sure you want to delete this entry?"
  description="This action cannot be undone."
  onYes={async () => {
    if (deleteConfirmDialog) {
      await deleteEntry(deleteConfirmDialog);
      deleteConfirmDialog = null;
    } else toast.error("No entry selected for deletion");
  }}
  bind:open={() => !!deleteConfirmDialog, (v) => (deleteConfirmDialog = !v ? null : deleteConfirmDialog)}
/>

<Dialog.Root
  open={editEntry.dialogOpen}
  onOpenChangeComplete={(_open) => {
    if (!_open) {
      editEntry.clear();
    }
  }}
>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Edit {editEntry.type === EntityType.user ? "User" : "Role"} Entry</Dialog.Title>
    </Dialog.Header>
    <div class="grid grid-cols-[1fr_4fr] gap-4">
      <Label>Entry</Label>
      <Mention
        userId={editEntry.type === EntityType.user ? editEntry.id : undefined}
        roleId={editEntry.type === EntityType.role ? editEntry.id : undefined}
        buttons="copy"
      />
      <Label>Scopes</Label>
      <Dropdown.Root>
        <Dropdown.Trigger
          class={cn(
            "border-input data-placeholder:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none select-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            "w-full sm:w-50",
          )}
        >
          Select Scopes
          <ChevronDown class="size-4 opacity-50" />
        </Dropdown.Trigger>
        <Dropdown.Content class="w-50">
          <Dropdown.Group>
            {#each dialogFields.scopes as _scope}
              <Dropdown.Item
                closeOnSelect={false}
                onclick={() => {
                  console.log("toggled scope", _scope.value);
                  toggleScope(editEntry, _scope.value);
                }}
              >
                {#if editEntry.scopes.has(_scope.value)}
                  <span class="absolute right-2 flex size-3.5 items-center justify-center">
                    <Check class="size-4" />
                  </span>
                {/if}
                {_scope.label}
              </Dropdown.Item>
            {/each}
          </Dropdown.Group>
        </Dropdown.Content>
      </Dropdown.Root>
    </div>
    <Dialog.Footer>
      <Button
        type="submit"
        onclick={() => {
          saveEntry(editEntry).then(() => {
            editEntry.clear();
          });
        }}
        showLoading={editEntry.loading}
        disabled={!editEntry.id || editEntry.scopes.size === 0 || editEntry.loading}
      >
        Save
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>