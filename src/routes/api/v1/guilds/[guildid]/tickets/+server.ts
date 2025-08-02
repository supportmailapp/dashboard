import { Ticket } from "$lib/server/db/models/src/ticket";
import type { ITicket } from "supportmail-types";
import { JsonErrors } from "$lib/constants";
import { FlattenDocToJSON } from "$lib/server/db";

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

export async function GET({ locals, url }) {
  if (!locals.guildId || !locals.isAuthenticated()) return JsonErrors.unauthorized();
  const guildId = locals.guildId;

  try {
    // Parse pagination parameters
    const Params = {
      page: Math.max(1, parseInt(url.searchParams.get("page") || "1")),
      pageSize: Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "10"))),
    };

    // Calculate skip value for pagination
    const skip = (Params.page - 1) * Params.pageSize;

    // Query tickets for the guild with pagination
    const [tickets, totalItems] = await Promise.all([
      Ticket.find({ guildId: guildId }, null, {
        sort: { lastActive: -1 },
        skip: skip,
        limit: Params.pageSize,
      }),
      Ticket.countDocuments({ guildId: guildId }),
    ]);

    const totalPages = Math.ceil(totalItems / Params.pageSize);

    const response: PaginatedResponse<ITicket> = {
      data: tickets.map((d) => FlattenDocToJSON(d)),
      pagination: {
        page: Params.page,
        pageSize: Params.pageSize,
        totalItems,
        totalPages,
      },
    };

    return Response.json(response);
  } catch (error) {
    const response: PaginatedResponse<ITicket> = {
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
