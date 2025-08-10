import { FlattenDocToJSON, Report, type FlattenDocResult } from "$lib/server/db";
import type { IReport } from "supportmail-types";

export async function load({ params }) {
  const { guildid, reportid } = params;

  const report = await Report.findOne({
    guildId: guildid,
    _id: reportid,
  });

  console.log("guildid", guildid);
  console.log("report", report);

  if (!report) {
    return {
      report: null,
      error: "Report not found",
    };
  }

  const sanitizedReport: FlattenDocResult<IReport, true> = FlattenDocToJSON(report, true);

  return {
    report: sanitizedReport,
  };
}
