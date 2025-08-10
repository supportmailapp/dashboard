import pkg, { model, Schema } from "mongoose";
const { models } = pkg;
import dayjs from "dayjs";
import { type IFeedback, type IFeedbackAnswer, type ITicket, TicketStatus } from "supportmail-types";

const feedbackAnswerSchema = new Schema<IFeedbackAnswer>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false },
);

const feedbackSchema = new Schema<IFeedback>(
  {
    stars: { type: Number, required: true, enum: [1, 2, 3, 4, 5] }, // 1-5
    questionAnswers: {
      type: [feedbackAnswerSchema],
      default: [],
    },
  },
  { _id: false },
);

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
    lastActive: { type: String, default: dayjs().toISOString() },
    feedback: { type: feedbackSchema, required: false },
  },
  { timestamps: true },
);

export const Ticket = models.Ticket
  ? model<ITicket>("Ticket")
  : model<ITicket>("Ticket", TicketSchema, "tickets");
