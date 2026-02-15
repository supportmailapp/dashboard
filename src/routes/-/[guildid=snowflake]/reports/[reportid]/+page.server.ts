import { FlattenDocToJSON, Report, type FlattenDocResult } from "$lib/server/db";
import type { IReport } from "$lib/sm-types";
import { error } from "@sveltejs/kit";
import { isValidObjectId } from "mongoose";

export async function load({ params }) {
  const { guildid, reportid } = params;

  if (!isValidObjectId(reportid)) {
    error(400, {
      message: "Invalid report ID",
      status: 400,
    });
  }

  const report = await Report.findOne({
    guildId: guildid,
    _id: reportid,
  });

  console.log("guildid", guildid);
  console.log("report", report);

  if (!report) {
    // return {
    //   report: null,
    //   error: "Report not found",
    // };
    error(404, {
      message: "Report not found",
      status: 404,
    });
  }

  const sanitizedReport: FlattenDocResult<IReport, true> = FlattenDocToJSON(report, true);

  return {
    report: sanitizedReport,
  };
}
