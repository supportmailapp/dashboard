import { Schema, model } from "mongoose";

export interface IDMReport {
  /**
   * The message ID of the reported DM.
   */
  reportedMessageId: string; // Original DM message ID
  /**
   * The user ID of the reporter.
   */
  reporterUserId: string; // Who reported it
  /**
   * The reason for the report.
   */
  reportReason: string;

  // Metadata from the original message
  /**
   * The author id of the reported message.
   */
  authorId: string;
  /**
   * The guild ID form which the reported message was sent.
   */
  guildId: string;
  /**
   * The content of the reported message.
   */
  messageContent: string;
  /**
   * The creation timestamp of the reported message.
   */
  messageTimestamp: Date;
  metadata: IMessageMetadata;
  /** @deprecated No longer in use because of `metadata` */
  messageAuthor: IMessageAuthor;
  /** @deprecated No longer in use because of `metadata` */
  messageFooter: IMessageFooter;

  // Report handling
  logMessageId?: string;
  status: "pending" | "resolved" | "ignored";
  handledBy?: string;
  handledAt?: Date;
  actionTaken?: "ban_reporter" | "ban_guild" | "manual" | "ignored";
  createdAt: Date;
  updatedAt: Date;
}

interface IMessageMetadata {
  /** @deprecated No longer in use because of `content` */
  name?: string;
  /** @deprecated No longer in use because of `content` */
  iconUrl?: string;
  /** @deprecated No longer in use because of `content` */
  url?: string;
  content?: string;
}

/** @deprecated No longer in use because of `IMessageMetadata` */
interface IMessageAuthor {
  name?: string;
  iconUrl?: string;
  url?: string;
}

/** @deprecated No longer in use because of `IMessageMetadata` */
interface IMessageFooter {
  text: string;
  iconUrl?: string;
}

const messageMetadataSchema = new Schema<IMessageMetadata>(
  {
    content: { type: String, required: false },
    name: { type: String, required: false },
    iconUrl: { type: String, required: false },
    url: { type: String, required: false },
  },
  {
    _id: false,
    versionKey: false,
  },
);

const messageFooterSchema = new Schema<IMessageFooter>(
  {
    text: { type: String, required: true },
    iconUrl: { type: String, required: false },
  },
  {
    _id: false,
    versionKey: false,
  },
);

const DMReportSchema = new Schema<IDMReport>(
  {
    reportedMessageId: { type: String, required: true },
    reporterUserId: { type: String, required: true },
    reportReason: { type: String, required: true },
    authorId: { type: String, required: true },
    guildId: { type: String, required: true },
    messageContent: { type: String, required: true },
    messageTimestamp: { type: Date, required: true },
    metadata: { type: messageMetadataSchema, required: false },
    messageAuthor: { type: messageMetadataSchema, required: false },
    messageFooter: { type: messageFooterSchema, required: false },
    logMessageId: { type: String, required: false },
    status: { type: String, enum: ["pending", "resolved", "ignored"], default: "pending" },
    handledBy: { type: String, required: false },
    handledAt: { type: Date, required: false },
    actionTaken: { type: String, enum: ["ban_reporter", "ban_guild", "manual", "ignored"], required: false },
  },
  {
    timestamps: true,
  },
);

export const DMReport = model<IDMReport>("DMReport", DMReportSchema, "dmReports");
