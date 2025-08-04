import { JsonErrors } from "$lib/constants";
import { FlattenDocToJSON, type FlattenDocResult } from "$lib/server/db";
import { Ticket } from "$lib/server/db/models/src/ticket";
import { safeParseInt } from "$lib/utils.js";
import type { FilterQuery } from "mongoose";
import type { ITicket } from "supportmail-types";
import { TicketStatus } from "supportmail-types";

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  error?: string;
};

export type PaginatedResponseWithError<T> = PaginatedResponse<T> & {
  error: string;
};

export type PaginatedTicketsResponse = PaginatedResponse<
  FlattenDocResult<ITicket & { userId?: string }, true>
>;

function sanitizeTicketData(
  ticket: FlattenDocResult<ITicket, true>,
): FlattenDocResult<ITicket & { userId?: string }, true> {
  return Object.assign(ticket, {
    userId: ticket.alias ? undefined : ticket.userId,
    feedback: undefined, // Feedback is not provided in the list response
  } as Partial<ITicket>);
}

export async function GET({ locals, url }) {
  if (!locals.guildId || !locals.isAuthenticated()) return JsonErrors.unauthorized();
  const guildId = locals.guildId;

  try {
    // Parse pagination parameters
    const Params = {
      page: safeParseInt(url.searchParams.get("page"), 1, 1),
      pageSize: safeParseInt(url.searchParams.get("pageSize"), 20, 10, 100),
      status: safeParseInt(url.searchParams.get("status"), -1, 0, 2) as -1 | TicketStatus | undefined,
      anonym: url.searchParams.get("anonym") === "true",
      search: url.searchParams.has("search")
        ? decodeURIComponent(url.searchParams.get("search")!)
        : undefined,
    };

    if (Params.status === -1) {
      Params.status = undefined;
    }

    console.log("Params:", Params);

    const skip = (Params.page - 1) * Params.pageSize;

    // Build filter query
    const filter: FilterQuery<ITicket> = { guildId: guildId };

    if (Params.anonym) {
      filter.alias = { $exists: true, $ne: null };
    }

    if (Params.status !== undefined) {
      filter.status = Params.status;
    }

    if (Params.search) {
      filter.$or = [
        { id: { $regex: Params.search, $options: "i" } },
        { postId: { $regex: Params.search, $options: "i" } },
        { userId: { $regex: Params.search, $options: "i" } },
      ];
    }

    // Query tickets for the guild with pagination
    const [tickets, totalItems] = await Promise.all([
      Ticket.find(filter, null, {
        sort: { lastActive: -1 },
        skip: skip,
        limit: Params.pageSize,
      }),
      Ticket.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / Params.pageSize);

    const response: PaginatedTicketsResponse = {
      data: tickets.map((d) => FlattenDocToJSON(d, true)).map(sanitizeTicketData),
      pagination: {
        page: Params.page,
        pageSize: Params.pageSize,
        totalItems,
        totalPages,
      },
    };

    console.log("Response:", response);

    return Response.json(response);
  } catch (error) {
    const response: PaginatedTicketsResponse = {
      data: [],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
      },
      error: "Failed to fetch tickets",
    };

    return Response.json(response, { status: 500 });
  }
}
