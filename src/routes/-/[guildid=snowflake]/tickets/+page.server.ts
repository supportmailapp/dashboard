import { validateSearchParams } from "runed/kit";
import { searchParamsSchema } from "./searchParams.js";
import type { APITicketResponse } from "$v1Api/guilds/[guildid=snowflake]/tickets/+server.js";

export async function load({ params, parent, url, fetch }) {
  await parent();

  const { searchParams } = validateSearchParams(url, searchParamsSchema);

  const response = await fetch(`/api/v1/guilds/${params.guildid}/tickets?${searchParams.toString()}`);

  return {
    tickets: (await response.json()) as APITicketResponse,
  };
}
