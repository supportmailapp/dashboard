// @ts-nocheck
// TODO | Currently not in use

import { model, Schema } from "mongoose";

export const LogConfigSchema = new Schema<unknown>({
  guildId: { type: String, required: true },
  moduleType: {
    type: String,
    enum: ["ticket", "report", "blacklist"],
    required: true,
  },
  enabledLogs: {
    type: [Number],
    required: true,
  },
  channelId: { type: String, required: false },
  webhookId: { type: String, required: false },
  webhookToken: { type: String, required: false },
  threadId: { type: String, required: false },
});

LogConfigSchema.index({ guildId: 1, moduleType: 1 }, { unique: true });

// export const DBLogConfig = model<unknown>("LogConfig", LogConfigSchema, "logConfigs");
