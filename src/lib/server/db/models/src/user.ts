import type { IDBUser } from "$lib/sm-types";
import pkg, { model, Schema } from "mongoose";
const { models } = pkg;

export const userSchema = new Schema<IDBUser>(
  {
    id: { type: String, required: true },
    language: { type: String, enum: ["en", "de", "fr"], default: "en" },
    autoRedirect: { type: Boolean, default: false },
    t_left: { type: Number, default: 50 },
    tips: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const DBUser = models.User ? model<IDBUser>("User") : model<IDBUser>("User", userSchema, "users");
