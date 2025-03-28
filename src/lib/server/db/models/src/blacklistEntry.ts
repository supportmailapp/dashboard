import { model, Schema } from "mongoose";
import type { IBlacklistEntry } from "supportmail-types";

const BlacklistEntrySchema = new Schema<IBlacklistEntry>(
  {
    id: { type: String, required: true }, // id of entity
    _type: { type: Number, required: true },
    guildId: { type: String, required: false },
    _module: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

// Ensures unique entries across the blacklist
// an ID can only be blacklisted once per module + per type + per guild
BlacklistEntrySchema.index({ id: 1, _type: 1, _module: 1, guildId: 1 }, { unique: true });

export const BlacklistEntry = model<IBlacklistEntry>("BlacklistEntry", BlacklistEntrySchema, "blacklist");
