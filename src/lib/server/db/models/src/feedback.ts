import type { IFeedbackAnswer, IFeedback, IFeedbackConfig, IFeedbackTags } from "$lib/sm-types/src";
import pkg, { model, Schema } from "mongoose";
import { FormComponentSchema } from "./utilSchemas";
const { models } = pkg;

const FeedbackTagsSchema = new Schema<IFeedbackTags>(
  {
    one: { type: String },
    two: { type: String },
    three: { type: String },
    four: { type: String },
    five: { type: String },
  },
  { _id: false },
);

const FeedbackConfigSchema = new Schema<IFeedbackConfig>(
  {
    guildId: { type: String, required: true, unique: true },
    isEnabled: { type: Boolean, default: false },
    thankYou: { type: String, required: false },
    tags: { type: FeedbackTagsSchema, required: false },
    components: { type: [FormComponentSchema], default: [], min: 0, max: 5 },
  },
  { _id: false },
);

export const FeedbackConfig = models.FeedbackConfig
  ? model<IFeedbackConfig>("FeedbackConfig")
  : model<IFeedbackConfig>("FeedbackConfig", FeedbackConfigSchema, "feedbackCfgs");

// Feedback itself

const FeedbackAnswerSchema = new Schema<IFeedbackAnswer>({
  questionId: { type: String, required: true },
  label: { type: String, required: true },
  answer: { type: String, required: true },
});

const FeedbackSchema = new Schema<IFeedback>({
  guildId: { type: String, required: true },
  ticketId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  answers: { type: [FeedbackAnswerSchema], default: [] },
  timestamp: { type: Date, default: () => new Date() },
});

// Ensure a guild can only submit one feedback per ticket
FeedbackSchema.index({ guildId: 1, ticketId: 1 }, { unique: true });

export const Feedback = models.Feedback
  ? model<IFeedback>("Feedback")
  : model<IFeedback>("Feedback", FeedbackSchema, "feedbacks");
