import type { ITicketCategory } from "$lib/sm-types";
import pkg, { model, Schema } from "mongoose";
import { customModalFieldSchema, EntitySchema, FormComponentSchema, partialEmojiSchema } from "./utilSchemas";
const { models } = pkg;

const ticketCategorySchema = new Schema<ITicketCategory>({
  guildId: { type: String, required: true },
  label: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  index: { type: Number, default: 1 },
  tag: { type: String, required: false },
  emoji: {
    type: partialEmojiSchema,
    required: false,
  },
  pings: {
    type: [EntitySchema],
    required: false,
  },
  fields: {
    type: [customModalFieldSchema],
    required: false,
    validate: {
      validator: (def: ITicketCategory["fields"]) => {
        return Array.isArray(def) && def.length <= 5;
      },
      message: (props: any) => `${props.value} exceeds the limit of 5 fields`,
    },
  },
  components: {
    type: [FormComponentSchema],
    default: [],
    max: 5,
    validate: {
      validator: (def: ITicketCategory["components"]) => {
        return Array.isArray(def) && def.length <= 5;
      },
      message: (props: any) => `${props.value} exceeds the limit of 5 components`,
    },
  },
  customMessageId: { type: String, required: false },
});

export const TicketCategory = models.TicketCategory
  ? model<ITicketCategory>("TicketCategory")
  : model<ITicketCategory>("TicketCategory", ticketCategorySchema, "ticketCategories");
