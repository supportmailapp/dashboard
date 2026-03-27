import { validateSearchParams } from "runed/kit";
import { searchParamsSchema } from "./searchParams.js";
import type { PaginatedReportsResponse } from "$v1Api/guilds/[guildid=snowflake]/reports/+server.js";

export async function load({ params, parent, url, fetch }) {
  await parent();

  const { searchParams } = validateSearchParams(url, searchParamsSchema);

  const response = await fetch(`/api/v1/guilds/${params.guildid}/reports?${searchParams.toString()}`);

  return {
    reports: (await response.json()) as PaginatedReportsResponse,
  };
}
