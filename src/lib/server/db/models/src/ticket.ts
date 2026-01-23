import { type ITicket, TicketStatus } from "$lib/sm-types";
import dayjs from "dayjs";
import pkg, { model, Schema } from "mongoose";
const { models } = pkg;

const TicketSchema = new Schema<ITicket>(
  {
    id: { type: String, required: true, unique: true },
    alias: { type: String, required: false },
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    postId: { type: String, required: true, index: true },
    forumId: { type: String, required: true },
    count: { type: Number, default: null }, // null because of legacy data
    status: { type: Number, default: TicketStatus.open },
    stateTag: { type: Number, required: false },
    closeComment: { type: String, default: null },
    feedbackId: { type: String, default: null },
    lastActive: { type: String, default: dayjs().toISOString() },
  },
  { timestamps: true },
);

export const Ticket = models.Ticket
  ? model<ITicket>("Ticket")
  : model<ITicket>("Ticket", TicketSchema, "tickets");
