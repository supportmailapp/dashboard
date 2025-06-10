import { model, Schema } from "mongoose";
import pkg from "mongoose";
const { models } = pkg;
import type { ICustomMessage } from "supportmail-types";

const customMessageSchema = new Schema<ICustomMessage>({
  guildId: { type: String, required: true },
  name: { type: String, required: true },
  components: { type: [Object], required: true, _id: false },
});

export const CustomMessage = models.CustomMessage
  ? model<ICustomMessage>("CustomMessage")
  : model<ICustomMessage>("CustomMessage", customMessageSchema, "customMessages");
