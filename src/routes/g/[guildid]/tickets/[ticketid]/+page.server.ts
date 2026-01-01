import { FlattenDocToJSON, Ticket, type FlattenDocResult } from "$lib/server/db";
import type { ITicket } from "$lib/sm-types";
import { error } from "@sveltejs/kit";

export async function load({ params }) {
  const { guildid, ticketid } = params;

  const ticket = await Ticket.findOne({
    guildId: guildid,
    id: ticketid,
  });

  if (!ticket) {
    error(404, {
      message: "Ticket not found",
    });
  }

  const sanitizedTicket: FlattenDocResult<ITicket & { userId?: string }, true> = FlattenDocToJSON(
    ticket,
    true,
  );
  if (sanitizedTicket.alias) {
    sanitizedTicket.userId = undefined as any;
  }

  return {
    ticket: sanitizedTicket,
  };
}
