import { JsonErrors } from "$lib/constants";
import { FlattenDocToJSON } from "$lib/server/db";
import { Report } from "$lib/server/db/models";
import { type IReport, ReportStatus } from "$lib/sm-types";
import { safeParseInt } from "$lib/utils.js";
import type { QueryFilter } from "mongoose";
import type {
  ReportSearchScope,
  ReportSearchType,
} from "../../../../../-/[guildid]/reports/FilterControls.svelte";

export type PaginatedReportsResponse = PaginatedResponse<
  DocumentWithId<Pick<IReport, "authorId" | "userId" | "guildId" | "createdAt" | "status" | "message">>
>;

export async function GET({ locals, url, params }) {
  if (!params.guildid || !locals.isAuthenticated()) return JsonErrors.unauthorized();

  try {
    // Parse pagination parameters
    const Params = {
      page: safeParseInt(url.searchParams.get("page"), 1, 1),
      pageSize: safeParseInt(url.searchParams.get("pageSize"), 20, 10, 100),
      status: safeParseInt(url.searchParams.get("status"), -1, 0, 6) as -1 | ReportStatus | undefined,
      search: url.searchParams.has("search")
        ? decodeURIComponent(url.searchParams.get("search")!)
        : undefined,
      searchScope: ((url.searchParams.get("sscope") as string) || "all") as ReportSearchScope,
      reportType: ((url.searchParams.get("type") as string) || "all") as ReportSearchType,
    };

    if (Params.status === -1) {
      Params.status = undefined;
    }

    const skip = (Params.page - 1) * Params.pageSize;

    // Build filter query
    const filter: QueryFilter<IReport> = { guildId: params.guildid };

    if (Params.status !== undefined) {
      filter.status = Params.status;
    }
    if (Params.reportType === "message") {
      filter.message = { $exists: true, $ne: null };
    }
    // Since we can only apply one $or condition, we have to filter out "non-message" reports later after fetching them
    // The $or condition is needed mainly for the search scope so it has a higher prio

    const filterFields: Record<Exclude<ReportSearchScope, "all">, (keyof IReport)[]> = {
      author: ["authorId"],
      comment: ["comment"],
      message: ["message", "logMessage"],
      moderator: ["resolvedBy"],
      user: ["userId"],
      reason: ["reason"],
    };
    const searchRegexFilter = { $regex: Params.search, $options: "i" };

    if (Params.search) {
      switch (Params.searchScope) {
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
          // Structure of the OR: [ { field1: { $regex... } }, { field2: { $regex... } }, ...]
          // In our case, there can be more fields, like: { field1: { $regex... }, field2: { $regex... } }
          const filterMap = Object.values(filterFields).flatMap((fields) =>
            fields.map((field) => ({
              [field]: searchRegexFilter,
            })),
          );
          filter.$or = filterMap;
          break;
      }
    }

    // Query reports for the guild with pagination
    const [reports, totalItems] = await Promise.all([
      Report.find(filter, null, {
        sort: { lastActive: -1 },
        skip: skip,
        limit: Params.pageSize,
      }),
      Report.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / Params.pageSize);

    const response: PaginatedReportsResponse = {
      data: reports
        .map((d) => FlattenDocToJSON(d, true))
        .filter((d) => Params.reportType !== "user" || !(Params.reportType === "user" && !d.message))
        .map((d) => ({
          _id: d._id,
          authorId: d.authorId,
          userId: d.userId,
          guildId: d.guildId,
          createdAt: d.createdAt,
          status: d.status,
          message: d.message,
        })),
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
    const response: PaginatedReportsResponse = {
      data: [],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
      },
      error: "Failed to fetch reports",
    };

    return Response.json(response, { status: 500 });
  }
}
