import { JsonErrors } from "$lib/constants.js";
import { Ticket } from "$lib/server/db/index.js";
import type { FlattenDocResult } from "$lib/server/db/utils.js";
import type { ITicket, TicketStatus } from "$lib/sm-types/src";
import { json } from "@sveltejs/kit";
import type { PipelineStage } from "mongoose";
import { validateSearchParams } from "runed/kit";
import { searchParamsSchema } from "../../../../../-/[guildid=snowflake]/tickets/searchParams.js";
import type { QueryFilter } from "mongoose";

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
  const { alias, userId, ...rest } = ticket;
  const returnBase = {
    ...rest,
    _id: ticket._id.toString(),
    category: String(ticket.category),
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    closedAt: ticket.closedAt ? ticket.closedAt.toISOString() : undefined,
  } as APITicket;

  // userId cannot be exposed when alias is present, as that would leak the user's identity
  if (alias) {
    return {
      ...returnBase,
      alias: alias,
    };
  }

  return {
    ...returnBase,
    userId: userId,
  };
}

export async function GET({ params, url, locals, isSubRequest }) {
  if (!locals.user && !isSubRequest) return JsonErrors.unauthorized();

  const guildId = params.guildid;
  const { data } = validateSearchParams(url, searchParamsSchema);

  const skip = (data.page - 1) * data.limit;
  const statuses: TicketStatus[] | undefined = data.status;

  // const afterTimestamp =
  //   afterParam && dayjs(afterParam).isValid() && dayjs(afterParam).isBefore(new Date())
  //     ? dayjs(afterParam).toDate()
  //     : undefined;
  // const beforeTimestamp =
  //   beforeParam && dayjs(beforeParam).isValid() && dayjs(beforeParam).isBefore(new Date())
  //     ? dayjs(beforeParam).toDate()
  //     : undefined;

  const matchStage: QueryFilter<ITicket> = { guildId };

  if (data.category.length > 0) {
    matchStage.category = { $in: data.category };
  }

  if (data.anonym === true) {
    matchStage.alias = { $exists: true, $ne: null };
  } else if (data.anonym === false) {
    matchStage.$nor = [{ alias: { $exists: true, $ne: null } }];
  }

  if (data.userId) {
    // never filter by userId when alias is present, as that would leak the user's identity
    matchStage.$and = [{ userId: data.userId }, { $or: [{ alias: { $exists: false } }, { alias: null }] }];
  }

  // if (afterTimestamp) matchStage.createdAt = { $gt: afterTimestamp };
  // if (beforeTimestamp) matchStage.createdAt = { ...matchStage.createdAt, $lt: beforeTimestamp };
  if (statuses && statuses.length > 0) {
    matchStage.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
  }

  const commentFilter = data.comment?.trim().replace(/\s{2,}/g, "");
  if (commentFilter) {
    matchStage.closeComment = { $regex: commentFilter, $options: "i" };
  }

  const matchStageItem = { $match: matchStage };

  const [tickets, countResult] = await Promise.all([
    Ticket.aggregate<ITicket>([matchStageItem, { $skip: skip }, { $limit: data.limit }]),
    Ticket.aggregate([matchStageItem, { $count: "total" }]),
  ]);

  const totalItems = countResult.length > 0 ? countResult[0].total : 0;
  const apiTickets = tickets.map(transformTicketToAPI);
  return json(makePaginatedResponse(apiTickets, totalItems, data.page, data.limit));
}
