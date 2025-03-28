import { model, Schema } from "mongoose";
import type { ITag } from "supportmail-types";

let tagSchema = new Schema<ITag>(
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
    onlyTickets: { type: Boolean, default: false }, // ? Add this or not?
  },
  { timestamps: true },
);

tagSchema.index({ guildId: 1, name: 1 }, { unique: true }); // Names should be unique per guild

export const DBTag = model<ITag>("Tag", tagSchema, "tags");
