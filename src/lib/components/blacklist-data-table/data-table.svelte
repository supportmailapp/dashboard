<script lang="ts" generics="TData, TValue">
  import { createSvelteTable, FlexRender } from "$ui/data-table/index.js";
  import * as Table from "$ui/table/index.js";
  import { getCoreRowModel, type ColumnDef, type RowSelectionState } from "@tanstack/table-core";

  type DataTableProps<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    rowSelection?: RowSelectionState;
  };

  let { data, columns, rowSelection = $bindable({}) }: DataTableProps<TData, TValue> = $props();

  $inspect("rowSelection", rowSelection);

  const table = createSvelteTable({
    get data() {
      return data;
    },
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: (updater) => {
      if (typeof updater === "function") {
        rowSelection = updater(rowSelection);
      } else {
        rowSelection = updater;
      }
    },
    state: {
      get rowSelection() {
        return rowSelection;
      },
    },
  });
</script>

<div class="overflow-x-auto rounded-md border">
  <Table.Root class="min-w-lg">
    <Table.Header>
      {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
        <Table.Row>
          {#each headerGroup.headers as header (header.id)}
            <Table.Head colspan={header.colSpan}>
              {#if !header.isPlaceholder}
                <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
              {/if}
            </Table.Head>
          {/each}
        </Table.Row>
      {/each}
    </Table.Header>
    <Table.Body>
      {#each table.getRowModel().rows as row (row.id)}
        <Table.Row data-state={row.getIsSelected() && "selected"}>
          {#each row.getVisibleCells() as cell (cell.id)}
            <Table.Cell>
              <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
            </Table.Cell>
          {/each}
        </Table.Row>
      {:else}
        <Table.Row>
          <Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
