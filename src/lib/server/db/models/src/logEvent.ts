import type { LogEventType, TLogEvent } from "$lib/sm-types";
import pkg, { model, Schema } from "mongoose";
const { models } = pkg;

const logEventSchema = new Schema<TLogEvent>({
  guildId: { type: String, required: true },
  timestamp: { type: Date, required: true },
  /**
   * @see {@link LogEventType}
   */
  typ: { type: String, required: true },
  extra: {
    type: Schema.Types.Mixed,
    required: false,
  },
  reason: { type: String, required: false },
});

export const LogEvent = models.LogEvent
  ? model<TLogEvent>("LogEvent")
  : model<TLogEvent>("LogEvent", logEventSchema, "logEvents");
