import { model, Schema } from "mongoose";
import type { IDBUser } from "supportmail-types";

export const userSchema = new Schema<IDBUser>(
  {
    id: { type: String, required: true },
    language: { type: String, enum: ["en", "de", "fr"], default: "en" },
    autoRedirect: { type: Boolean, default: false },
    t_left: { type: Number, default: 50 },
    tips: { type: Boolean, default: true },
    tokens: { type: String, default: null },
  },
  { timestamps: true },
);

export const DBUser = model<IDBUser>("User", userSchema, "users");
