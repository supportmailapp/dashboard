import { DMReport, FlattenDocToJSON } from "$lib/server/db";

export async function load({ url }) {
  const pageNum = Number(url.searchParams.get("page") ?? "1");
  const pageSize = 50;
  const openReports = await DMReport.find({ status: { $ne: "pending" } }, null, {
    sort: { createdAt: -1 },
    limit: pageSize,
    skip: (pageNum - 1) * pageSize,
  });
  const totalOpenReports = await DMReport.countDocuments({ status: { $ne: "pending" } });

  return {
    reports: openReports.map((d) => FlattenDocToJSON(d, true)),
    total: totalOpenReports,
    page: pageNum,
    pageSize,
    maxPages: Math.ceil(totalOpenReports / pageSize),
  };
}
