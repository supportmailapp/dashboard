import { model, Schema } from "mongoose";
import pkg from "mongoose";
const { models } = pkg;
import type { IDBMessage } from "supportmail-types";

export const DBMessage = models.Message
  ? model<IDBMessage>("Message")
  : model<IDBMessage>(
      "Message",
      new Schema<IDBMessage>({
        watch: { type: String, required: true },
        edit: { type: String, required: true },
        guildId: { type: String, required: true },
        ticketId: { type: String, required: true },
      }),
      "messages",
    );
