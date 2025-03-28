import { model, Schema } from "mongoose";
import type { ICloseRequest } from "supportmail-types";

export const CloseRequest = model<ICloseRequest>(
  "CloseRequest",
  new Schema<ICloseRequest>(
    {
      ticketId: { type: String, required: true, unique: true },
      postId: { type: String, required: false },
      author: { type: String, required: true },
      closeTime: { type: String, required: false },
      dmMessage: { type: String, required: true },
      guildMessage: { type: String, required: true },
      comment: {
        type: {
          text: { type: String, required: false },
          private: { type: Boolean, required: false },
        },
        default: { text: null, private: false },
      },
    },
    { timestamps: true },
  ),
  "close_requests",
);
