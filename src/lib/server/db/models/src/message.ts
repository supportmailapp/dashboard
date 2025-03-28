import { model, Schema } from "mongoose";
import type { IDBMessage } from "supportmail-types";

export const DBMessage = model<IDBMessage>(
  "Message",
  new Schema<IDBMessage>({
    watch: { type: String, required: true },
    edit: { type: String, required: true },
    guildId: { type: String, required: true },
    ticketId: { type: String, required: true },
  }),
  "messages",
);
