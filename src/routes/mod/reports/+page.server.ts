import { DMReport, FlattenDocToJSON } from "$lib/server/db";
import { safeParseInt } from "$lib/utils.js";

export async function load({ url }) {
  const pageNum = safeParseInt(url.searchParams.get("page"), 1, 1, Number.MAX_SAFE_INTEGER);
  const pageSize = safeParseInt(url.searchParams.get("pageSize"), 50, 10, 100);
  const openReports = await DMReport.find({ status: "pending" }, null, {
    sort: { createdAt: -1 },
    limit: pageSize,
    skip: (pageNum - 1) * pageSize,
  });
  const totalOpenReports = await DMReport.countDocuments({ status: "pending" });

  return {
    reports: openReports.map((d) => FlattenDocToJSON(d, true)),
    total: totalOpenReports,
    page: pageNum,
    pageSize,
    maxPages: Math.ceil(totalOpenReports / pageSize),
  };
}
