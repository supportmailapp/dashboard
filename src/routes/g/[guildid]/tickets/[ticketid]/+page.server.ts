import { FlattenDocToJSON, Ticket, type FlattenDocResult } from "$lib/server/db";
import type { ITicket } from "supportmail-types";

export async function load({ params }) {
  const { guildid, ticketid } = params;

  const ticket = await Ticket.findOne({
    guildId: guildid,
    id: ticketid,
  });

  if (!ticket) {
    return {
      ticket: null,
      error: "Ticket not found",
    };
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
