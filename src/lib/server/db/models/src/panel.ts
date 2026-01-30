import type { IPanel } from "$lib/sm-types";
import pkg, { model, Schema } from "mongoose";
const { models } = pkg;

const allowedMentionsSchema = new Schema<IPanel["allowedMentions"]>(
  {
    parse: { type: [String], default: [] },
    roles: { type: [String], default: [] },
    users: { type: [String], default: [] },
  },
  { _id: false },
);

const panelSchema = new Schema<IPanel>({
  guildId: { type: String, required: true, unique: true, index: true },
  data: { type: Schema.Types.Mixed, required: true },
  allowedMentions: { type: allowedMentionsSchema, default: () => ({ parse: [], users: [], roles: [] }) },
});

export const Panel = models.Panel ? model<IPanel>("Panel") : model<IPanel>("Panel", panelSchema, "panels");
