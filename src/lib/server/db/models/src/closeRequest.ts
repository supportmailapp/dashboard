import { model, Schema } from "mongoose";
import pkg from "mongoose";
const { models } = pkg;
import type { ICloseRequest } from "supportmail-types";

export const CloseRequest = models.CloseRequest
  ? model<ICloseRequest>("CloseRequest")
  : model<ICloseRequest>(
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
