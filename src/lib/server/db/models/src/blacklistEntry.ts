import { model, Schema } from "mongoose";
import pkg from "mongoose";
const { models } = pkg;
import type { IBlacklistEntry } from "supportmail-types";

const BlacklistEntrySchema = new Schema<IBlacklistEntry>(
  {
    id: { type: String, required: true }, // id of entity
    _type: { type: Number, required: true },
    guildId: { type: String, required: false },
    scope: { type: Number, required: true },
    scopes: {
      type: Schema.Types.BigInt,
      required: true,
    },
  },
  { timestamps: true },
);

// Ensures unique entries across the blacklist
// an ID can only be blacklisted once per module + per type + per guild
BlacklistEntrySchema.index({ id: 1, _type: 1, scope: 1, guildId: 1 }, { unique: true });

export const BlacklistEntry = models.BlacklistEntry
  ? model<IBlacklistEntry>("BlacklistEntry")
  : model<IBlacklistEntry>("BlacklistEntry", BlacklistEntrySchema, "blacklist");
