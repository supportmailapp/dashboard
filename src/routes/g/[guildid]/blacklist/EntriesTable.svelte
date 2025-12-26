<script lang="ts">
  import AreYouSureDialog from "$lib/components/AreYouSureDialog.svelte";
  import DataTableActions from "$lib/components/blacklist-data-table/data-table-actions.svelte";
  import DataTableCheckbox from "$lib/components/blacklist-data-table/data-table-checkbox.svelte";
  import DataTable from "$lib/components/blacklist-data-table/data-table.svelte";
  import ScopesCell from "$lib/components/blacklist-data-table/ScopesCell.svelte";
  import Mention from "$lib/components/discord/Mention.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import { EntityType } from "$lib/sm-types";
  import { cn } from "$lib/utils";
  import { Button } from "$ui/button";
  import { renderComponent } from "$ui/data-table";
  import * as Dialog from "$ui/dialog/index.js";
  import * as Dropdown from "$ui/dropdown-menu/index.js";
  import Label from "$ui/label/label.svelte";
  import Check from "@lucide/svelte/icons/check";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import { type ColumnDef, type RowSelectionState } from "@tanstack/table-core";
  import { toast } from "svelte-sonner";
  import type {
    APIBlacklistEntry,
    PaginatedBlacklistResponse,
  } from "../../../api/v1/guilds/[guildid]/blacklist/+server";
  import { BLEntry, dialogFields, toggleScope } from "./entry.svelte";

  let {
    entries,
    pageStatus = $bindable(),
    rowSelection = $bindable(),
    saveEntry,
    deleteEntry,
  }: {
    entries: PaginatedBlacklistResponse["data"];
    pageStatus: "loading" | "loaded" | "error";
    rowSelection: RowSelectionState;
    saveEntry: (entry: BLEntry) => Promise<void>;
    deleteEntry: (_id: string) => Promise<void>;
  } = $props();

  let deleteConfirmDialog = $state<string | null>(null);
  let editEntry = new BLEntry();

  const cols: ColumnDef<APIBlacklistEntry>[] = [
    {
      id: "select",
      header: ({ table }) =>
        renderComponent(DataTableCheckbox, {
          checked: table.getIsAllPageRowsSelected(),
          indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
          onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
          "aria-label": "Select all",
        }),
      cell: ({ row }) =>
        renderComponent(DataTableCheckbox, {
          checked: row.getIsSelected(),
          onCheckedChange: (value) => row.toggleSelected(!!value),
          "aria-label": "Select row",
        }),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "_id",
      header: "Entry",
      cell: ({ row }) => {
        const isUser = row.original._type === EntityType.user;
        return renderComponent(Mention, {
          userId: isUser ? row.original.id : undefined,
          roleId: !isUser ? row.original.id : undefined,
          buttons: "copy",
        });
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        switch (row.original._type) {
          case EntityType.user:
            return "User";
          case EntityType.role:
            return "Role";
          default:
            return "Unknown";
        }
      },
    },
    {
      accessorKey: "scopes",
      header: "Scopes",
      cell: ({ row }) => {
        return renderComponent(ScopesCell, { scopes: BigInt(row.original.scopes) });
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return renderComponent(DataTableActions, {
          _id: row.original._id,
          onEdit: (_id) => {
            editEntry.loadFrom(entries.find((e) => e._id === _id)!);
            editEntry.dialogOpen = true;
          },
          onDelete: (_id) => {
            deleteConfirmDialog = _id;
          },
        });
      },
    },
  ];
</script>

{#if pageStatus === "loaded"}
  {#key entries}
    <DataTable columns={cols} data={entries} bind:rowSelection />
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
      deleteConfirmDialog = null; // Clear the dialog after deletion
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
            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none select-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
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
