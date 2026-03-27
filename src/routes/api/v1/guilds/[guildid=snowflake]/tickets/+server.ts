import { JsonErrors } from "$lib/constants.js";
import { Ticket } from "$lib/server/db/index.js";
import type { FlattenDocResult } from "$lib/server/db/utils.js";
import type { ITicket } from "$lib/sm-types/src";
import { json } from "@sveltejs/kit";
import type { PipelineStage } from "mongoose";
import { validateSearchParams } from "runed/kit";
import { searchParamsSchema } from "../../../../../-/[guildid=snowflake]/tickets/searchParams.js";

export type APITicket = FlattenDocResult<
  Omit<ITicket, "createdAt" | "updatedAt" | "category"> & {
    category: string;
    createdAt: string;
    updatedAt: string;
    closedAt?: string;
  },
  true
>;

export type APITicketResponse = PaginatedResponse<WithId<APITicket>>;

function makePaginatedResponse(
  items: APITicketResponse["data"],
  totalItems: number,
  page: number,
  limit: number,
): APITicketResponse {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    data: items,
    pagination: {
      total: totalItems,
      page: page,
      limit: limit,
      pages: totalPages,
    },
  };
}

function transformTicketToAPI(ticket: any): APITicket {
  return {
    ...ticket,
    _id: ticket._id.toString(),
    category: ticket.category,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    closedAt: ticket.closedAt ? ticket.closedAt.toISOString() : undefined,
  } as APITicket;
}

export async function GET({ params, url, locals, isSubRequest }) {
  if (!locals.user && !isSubRequest) return JsonErrors.unauthorized();

  const guildId = params.guildid;
  const { data } = validateSearchParams(url, searchParamsSchema);

  const skip = (data.page - 1) * data.limit;
  const statuses: string[] | undefined = data.status;

  // const afterTimestamp =
  //   afterParam && dayjs(afterParam).isValid() && dayjs(afterParam).isBefore(new Date())
  //     ? dayjs(afterParam).toDate()
  //     : undefined;
  // const beforeTimestamp =
  //   beforeParam && dayjs(beforeParam).isValid() && dayjs(beforeParam).isBefore(new Date())
  //     ? dayjs(beforeParam).toDate()
  //     : undefined;

  const matchStage: PipelineStage.Match["$match"] = { guildId };

  // Handle category and uncategorized filters
  if (data.category.length > 0) {
    if (data.uncategorized) {
      // Include both specific categories and uncategorized tickets
      matchStage.$or = [{ category: { $in: data.category } }, { category: null }];
    } else {
      // Only specific categories
      matchStage.category = { $in: data.category };
    }
  }

  if (data.userId) {
    matchStage.userId = data.userId;
    matchStage.claimedBy = data.userId;
  }
  // if (afterTimestamp) matchStage.createdAt = { $gt: afterTimestamp };
  // if (beforeTimestamp) matchStage.createdAt = { ...matchStage.createdAt, $lt: beforeTimestamp };
  if (statuses && statuses.length > 0) {
    matchStage.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }

  const pipeline: PipelineStage[] = [{ $match: matchStage }];

  const [tickets, countResult] = await Promise.all([
    Ticket.aggregate([...pipeline, { $skip: skip }, { $limit: data.limit }]),
    Ticket.aggregate([...pipeline, { $count: "total" }]),
  ]);

  const totalItems = countResult.length > 0 ? countResult[0].total : 0;
  const apiTickets = tickets.map(transformTicketToAPI);
  return json(makePaginatedResponse(apiTickets, totalItems, data.page, data.limit));
}
