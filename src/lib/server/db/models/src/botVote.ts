import { type HydratedDocument, model, Schema } from "mongoose";
import type { IBotVote } from "supportmail-types";

const botVoteSchema = new Schema<IBotVote>({
  userId: { type: String, required: true },
  botId: { type: String, default: process.env.CLIENT_ID },
  hasRole: { type: Boolean, default: false },
  removeRoleBy: { type: Date, required: false },
});

export const BotVote = model<IBotVote>("BotVote", botVoteSchema, "botVotes");
