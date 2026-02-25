import type { TLogEvent } from "$lib/sm-types";
import pkg, { model, Schema } from "mongoose";
const { models } = pkg;

const logEventSchema = new Schema<TLogEvent>({
  typ: { type: String, required: true },
  guildId: { type: String, required: true },
  timestamp: { type: Date, default: () => new Date() },
  reason: { type: String, required: false },
  extra: {
    type: Schema.Types.Mixed,
    required: false,
  },
});

export const LogEvent = models.LogEvent
  ? model<TLogEvent>("LogEvent")
  : model<TLogEvent>("LogEvent", logEventSchema, "logEvents");
