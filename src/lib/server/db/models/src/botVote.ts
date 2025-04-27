import { model, Schema } from "mongoose";
import pkg from "mongoose";
const { models } = pkg;
import type { IBotVote } from "supportmail-types";

const botVoteSchema = new Schema<IBotVote>({
  userId: { type: String, required: true },
  botId: { type: String, default: process.env.CLIENT_ID },
  hasRole: { type: Boolean, default: false },
  removeRoleBy: { type: Date, required: false },
});

export const BotVote = models.BotVote ? model<IBotVote>("BotVote") : model<IBotVote>("BotVote", botVoteSchema, "botVotes");
