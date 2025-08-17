<script lang="ts">
  import { type ColumnDef } from "@tanstack/table-core";
  import DataTable from "$lib/components/data-table.svelte";
  import type {
    APIBlacklistEntry,
    PaginatedBlacklistResponse,
  } from "../../../api/v1/guilds/[guildid]/blacklist/+server";

  let { entries }: { entries: PaginatedBlacklistResponse["data"] } = $props();

  const cols: ColumnDef<APIBlacklistEntry>[] = [
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
