import { model, Schema } from "mongoose";
import pkg from "mongoose";
const { models } = pkg;
import type { ITicketCategory } from "supportmail-types";
import { customModalFieldSchema, entitySchema, partialEmojiSchema } from "./utilSchemas";

const ticketCategorySchema = new Schema<ITicketCategory>({
  guildId: { type: String, required: true },
  label: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  index: { type: Number, default: 1 },
  tag: { type: String, required: true },
  emoji: {
    type: partialEmojiSchema,
    required: false,
  },
  pings: {
    type: [entitySchema],
    required: false,
  },
  fields: {
    type: [customModalFieldSchema],
    required: false,
    validate: {
      validator: function (_) {
        return Array.isArray(this.fields) && this.fields.length <= 5;
      },
      message: (props: any) => `${props.value} exceeds the limit of 5 fields`,
    },
  },
  customMessageId: { type: String, required: false },
});

export const TicketCategory = models.TicketCategory
  ? model<ITicketCategory>("TicketCategory")
  : model<ITicketCategory>("TicketCategory", ticketCategorySchema, "ticketCategories");
