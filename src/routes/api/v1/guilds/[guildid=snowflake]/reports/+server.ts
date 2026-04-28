import { JsonErrors } from "$lib/constants";
import { FlattenDocToJSON } from "$lib/server/db";
import { Report } from "$lib/server/db/models";
import { type IReport, ReportStatus } from "$lib/sm-types";
import { json } from "@sveltejs/kit";
import type { QueryFilter } from "mongoose";
import { validateSearchParams } from "runed/kit";
import {
  searchParamsSchema,
  type ReportSearchScope,
} from "../../../../../-/[guildid=snowflake]/reports/searchParams.js";

export type PaginatedReportsResponse = PaginatedResponse<
  WithId<Pick<IReport, "authorId" | "userId" | "guildId" | "createdAt" | "status" | "message">>
>;

export async function GET({ locals, url, params }) {
  if (!params.guildid || !locals.isAuthenticated()) return JsonErrors.unauthorized();

  const { data } = validateSearchParams(url, searchParamsSchema);

  const skip = (data.page - 1) * data.pageSize;
  const filter: QueryFilter<IReport> = { guildId: params.guildid };

  if (data.status !== -1) {
    filter.status = data.status as ReportStatus;
  }

  if (data.type === "message") {
    filter.message = { $exists: true, $ne: null };
  } else if (data.type === "user") {
    filter.message = { $exists: false };
  }

  const filterFields: Record<Exclude<ReportSearchScope, "all">, (keyof IReport)[]> = {
    author: ["authorId"],
    comment: ["comment"],
    message: ["message", "logMessage"],
    moderator: ["resolvedBy"],
    user: ["userId"],
    reason: ["reason"],
  };

  if (data.search) {
    const searchRegexFilter = { $regex: data.search, $options: "i" };
    switch (data.sscope as ReportSearchScope) {
      case "author":
        filter.authorId = searchRegexFilter;
        break;
      case "comment":
        filter.comment = searchRegexFilter;
        break;
      case "message":
        filter.message = searchRegexFilter;
        break;
      case "moderator":
        filter.resolvedBy = searchRegexFilter;
        break;
      case "user":
        filter.userId = searchRegexFilter;
        break;
      case "reason":
        filter.reason = searchRegexFilter;
        break;
      default:
        filter.$or = Object.values(filterFields).flatMap((fields) =>
          fields.map((field) => ({ [field]: searchRegexFilter })),
        );
        break;
    }
  }

  const [reports, totalItems] = await Promise.all([
    Report.find(filter, null, { sort: { createdAt: -1 }, skip, limit: data.pageSize }),
    Report.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalItems / data.pageSize);

  return json({
    data: reports.map((d) => FlattenDocToJSON(d, true)).map((d) => ({
      _id: d._id,
      authorId: d.authorId,
      userId: d.userId,
      guildId: d.guildId,
      createdAt: d.createdAt,
      status: d.status,
      message: d.message,
    })),
    pagination: {
      total: totalItems,
      page: data.page,
      limit: data.pageSize,
      pages: totalPages,
    },
  } satisfies PaginatedReportsResponse);
}
