import type {
  IDBGuild,
  IGuildFlags,
  IReportConfig,
  IStatusTags,
  ITicketConfig,
  PausedUntil,
  ReportLimitsConfig,
} from "$lib/sm-types";
import pkg, { model, Schema } from "mongoose";
import { EntitySchema, SpecialChannelSchema } from "./utilSchemas";
const { models } = pkg;

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
  webhookDocId: { type: String, required: false },
  pings: { type: [EntitySchema], required: false },
  creationMessage: { type: String, required: false },
  closeMessage: { type: String, required: false },
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
  autoResolve: { type: Boolean, default: false },
  channels: {
    setting: { type: String, enum: ["IN", "EX"], default: "EX" },
    ids: { type: [SpecialChannelSchema], default: [] },
  },
  pings: { type: [EntitySchema], required: false },
  immune: { type: [EntitySchema], required: false },
  mods: { type: [EntitySchema], required: false },
  limits: {
    type: reportLimitsSchema,
    default: {
      perUserReceive: 1,
      perUserCreate: 5,
      opens: 20,
    },
  },
  notifications: { type: [Number], default: [] },
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
    flags: { type: GuildFlagsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export const DBGuild = models.Guild
  ? model<IDBGuild>("Guild")
  : model<IDBGuild>("Guild", DBGuildSchema, "guilds");
