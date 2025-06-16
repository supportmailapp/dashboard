import { model, Schema } from "mongoose";
import pkg from "mongoose";
const { models } = pkg;
import {
  NotificationLevel,
  type ICustomModalField,
  type IFeedbackConfig,
  type IFeedbackTags,
  type IStatusTags,
  type ITicketConfig,
  type ReportLimitsConfig,
  type IReportConfig,
  type IGuildFlags,
  type IDBGuild,
  type PausedUntil,
} from "supportmail-types";

const CustomModalFieldSchema = new Schema<ICustomModalField>(
  {
    position: { type: Number, default: 1 },
    label: { type: String, required: true },
    placeholder: { type: String, required: false },
    style: { type: Number, default: 1 },
    minL: { type: Number, default: 0 },
    maxL: { type: Number, default: 256 },
    _required: { type: Boolean, default: true },
  },
  { id: false },
);

const FeedbackTagsSchema = new Schema<IFeedbackTags>(
  {
    one: { type: String },
    two: { type: String },
    three: { type: String },
    four: { type: String },
    five: { type: String },
  },
  { id: false },
);

const FeedbackConfigSchema = new Schema<IFeedbackConfig>(
  {
    postId: { type: String, required: false }, // Post where the feedbacks should be sent
    questions: { type: [CustomModalFieldSchema], required: false },
    thankYou: { type: String, required: false },
    tags: {
      type: FeedbackTagsSchema,
      required: false,
    },
  },
  { id: false },
);

const statusTagsSchema = new Schema<IStatusTags>(
  {
    open: { type: String },
    closed: { type: String },
    unanswered: { type: String },
    pendingQR: { type: String },
    uResponded: { type: String },
    awaitingRes: { type: String },
  },
  { id: false },
);

const pausedUntilSchema = new Schema<PausedUntil>(
  {
    value: { type: Boolean, default: false },
    date: { type: Date, default: null }, // timestamp when it should resume
  },
  { _id: false },
);

const ticketConfigSchema = new Schema<ITicketConfig>({
  enabled: { type: Boolean, default: false },
  pausedUntil: { type: pausedUntilSchema, default: { value: false, date: null } }, // ISO timestamp if the date + time when it should resume
  forumId: { type: String, default: null },
  tags: { type: statusTagsSchema, required: false },
  anonym: {
    user: { type: Boolean, default: false },
    enabled: { type: Boolean, default: false },
    alias: { type: String, default: null },
  },
  autoForwarding: { type: Boolean, default: true },
  allowedBots: { type: [String], required: false },
  feedback: { type: FeedbackConfigSchema, required: false },
});

const reportLimitsSchema = new Schema<ReportLimitsConfig>(
  {
    perUserReceive: { type: Number, default: 1 },
    perUserCreate: { type: Number, default: 5 },
    opens: { type: Number, default: 20 },
  },
  { id: false },
);

const reportConfigSchema = new Schema<IReportConfig>({
  enabled: { type: Boolean, default: false },
  pausedUntil: { type: pausedUntilSchema, default: { value: false, date: null } },
  channelId: { type: String, default: null },
  actionsEnabled: { type: Boolean, default: true },
  channels: {
    setting: { type: String, enum: ["IN", "EX"], default: "EX" },
    ids: { type: [{ t: Number, id: String }], default: [] },
  },
  pings: { type: [[String, String]], required: false }, // [ [ "prefix", "id" ] ]
  immune: { type: [[String, String]], required: false }, // [ [ "prefix", "id" ] ]
  mods: { type: [[String, String]], required: false }, // [ [ "prefix", "id" ] ]
  limits: {
    type: reportLimitsSchema,
    default: {
      perUserReceive: 1,
      perUserCreate: 5,
      opens: 20,
    },
  },
  notificationLevel: { type: Number, default: NotificationLevel.OnlyReport },
});

const GuildFlagsSchema = new Schema<IGuildFlags>(
  {
    deleteAfter: { type: Date, default: null },
    partner: { type: Boolean, default: false },
  },
  { id: false },
);

const DBGuildSchema = new Schema<IDBGuild>(
  {
    id: { type: String, required: true, unique: true },
    icon: {
      type: String,
      default: "3e8fb5ca5c7e2c1acd5727bbf9c8076c",
    }, // the guild icon's hash
    name: { type: String, required: true },
    lang: { type: String, enum: ["en", "de", "fr"], default: "en" },
    ticketConfig: { type: ticketConfigSchema, default: { enabled: false } },
    reportConfig: { type: reportConfigSchema, default: { enabled: false } },
    blacklistImmune: { type: [[Number, String]], required: false },
    flags: { type: GuildFlagsSchema, default: {} },
  },
  { timestamps: true },
);

export const DBGuild = models.Guild
  ? model<IDBGuild>("Guild")
  : model<IDBGuild>("Guild", DBGuildSchema, "guilds");
