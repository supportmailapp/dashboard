<script lang="ts">
  import type { IBlacklistEntry } from "supportmail-types";
  import { type ColumnDef } from "@tanstack/table-core";
  import DataTable from "$lib/components/data-table.svelte";

  let { entries }: { entries: DocumentWithId<IBlacklistEntry>[] } = $props();

  const cols: ColumnDef<IBlacklistEntry>[] = [
    {
      accessorKey: "scope",
      header: "Scope",
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "id",
      header: "Entry",
    },
  ];
</script>

<DataTable columns={cols} data={entries} />
