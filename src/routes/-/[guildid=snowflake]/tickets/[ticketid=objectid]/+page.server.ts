import { Ticket } from "$lib/server/db/index.js";
import { FlattenDocToJSON } from "$lib/server/db/utils.js";
import { error } from "@sveltejs/kit";

export async function load({ params, fetch, locals }) {
  const ticket = await Ticket.findOne({
    _id: params.ticketid,
    guildId: params.guildid,
  });

  if (!ticket) {
    error(404, {
      message: "Ticket not found",
    });
  }

  return {
    ticket: FlattenDocToJSON(ticket, true),
  };
}
