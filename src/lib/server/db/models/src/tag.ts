import type { ITag } from "$lib/sm-types";
import pkg, { model, Schema } from "mongoose";
const { models } = pkg;

const tagSchema = new Schema<ITag>(
  {
    guildId: { type: String, required: true },
    name: {
      type: String,
      required: true,
      trim: true,
      text: true,
      minlength: 2,
      maxlength: 50,
      lowercase: true,
    },
    content: { type: String, trim: true, maxlength: 4000 },
    onlyTickets: { type: Boolean, default: false },
  },
  { timestamps: true },
);

tagSchema.index({ guildId: 1, name: 1 }, { unique: true }); // Names should be unique per guild

export const DBTag = models.Tag ? model<ITag>("Tag") : model<ITag>("Tag", tagSchema, "tags");
