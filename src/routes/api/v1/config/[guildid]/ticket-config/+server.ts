import { updateGuild } from "$lib/server/db";
import type { ITicketConfig } from "supportmail-types";

export const PATCH = async ({ request, locals }) => {
  const payload = (await request.json()) as ITicketConfig;
  const res = await updateGuild(locals.guildId as string, { $set: { ticketConfig: payload } });
  console.log(res);
  return new Response(undefined, { status: 200 });
};
