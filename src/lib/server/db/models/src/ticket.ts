import dayjs from "dayjs";
import { model, Schema } from "mongoose";
import { TicketStatus, type IFeedback, type ITicket } from "supportmail-types";

const feedbackSchema = new Schema<IFeedback>(
  {
    stars: { type: Number, required: true }, // 1-5
    questionAnswers: {
      type: Schema.Types.Mixed,
      required: false,
      _id: false,
    }, // Question answers mapped by the question position: { [key: string]: string }
    messageId: { type: String, required: true }, // Id of the message in the feedback channel in the server
  },
  { _id: false },
);

export const Ticket = model<ITicket>(
  "Ticket",
  new Schema<ITicket>(
    {
      id: { type: String, required: true, unique: true },
      alias: { type: String, required: false },
      userId: { type: String, required: true },
      guildId: { type: String, required: true },
      postId: { type: String, required: true },
      forumId: { type: String, required: true },
      count: { type: Number, default: null }, // null because of legacy data
      status: { type: Number, default: TicketStatus.open },
      stateTag: { type: Number, required: false },
      closeComment: { type: String, default: null },
      lastActive: { type: String, default: dayjs().toISOString() },
      feedback: { type: feedbackSchema, required: false },
    },
    { timestamps: true },
  ),
  "tickets",
);
