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
    validate: {
      validator: (v: any) => {
        // Only strings, numbers, and booleans are allowed as values
        if (typeof v !== "object" || v === null) return false;
        return Object.values(v).every(
          (value) => typeof value === "string" || typeof value === "number" || typeof value === "boolean",
        );
      },
      message: "Extra field can only contain strings, numbers, or booleans.",
    },
  },
});

export const LogEvent = models.LogEvent
  ? model<TLogEvent>("LogEvent")
  : model<TLogEvent>("LogEvent", logEventSchema, "logEvents");
