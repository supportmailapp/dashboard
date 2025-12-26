import type { ICustomMessage } from "$lib/sm-types";
import pkg, { model, Schema } from "mongoose";
const { models } = pkg;

const customMessageSchema = new Schema<ICustomMessage>({
  guildId: { type: String, required: true },
  name: { type: String, required: true },
  components: { type: [Object], required: true, _id: false },
});

export const CustomMessage = models.CustomMessage
  ? model<ICustomMessage>("CustomMessage")
  : model<ICustomMessage>("CustomMessage", customMessageSchema, "customMessages");
