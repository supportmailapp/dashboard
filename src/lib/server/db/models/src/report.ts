import { model, Schema } from "mongoose";
import { ReportStatus, type IReport } from "supportmail-types";

export const DBReport = model<IReport>(
  "Report",
  new Schema<IReport>(
    {
      reportId: { type: String, required: true },
      userId: { type: String, required: true },
      guildId: { type: String, required: true },
      authorId: { type: String, required: true },
      logMessage: { type: String, required: false },
      message: { type: String, required: false },
      status: { type: Number, default: ReportStatus.open },
      reason: { type: String, required: false },
      comment: { type: String, required: false },
      resolvedBy: { type: String, required: false },
    },
    { timestamps: true },
  ),
  "reports",
);
