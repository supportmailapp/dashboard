import type { ICommandConfig } from "$lib/sm-types";
import pkg, { model, Schema } from "mongoose";
import { SpecialChannelSchema } from "./utilSchemas";
const { models } = pkg;

const CommandConfigSchema = new Schema<ICommandConfig>({
  id: { type: String, required: false },
  commandPath: {
    type: String,
    required: true,
    validate: {
      validator: (v: string) => v.split("/").length <= 3 && v.split("/").length >= 1,
      message: (props) => `${props.value} is not a valid command path!`,
    },
    trim: true,
    minlength: 1,
    maxlength: 98, // Because the longest command path is 3 * 32 + 2 = 98 (command name is 1-32 chars + max 2 slashes)
  },
  guildId: { type: String, default: null },
  channels: { type: [SpecialChannelSchema], default: [] },
  roles: { type: [String], default: [] },
  users: { type: [String], default: [] },
  permissions: {
    type: Schema.Types.BigInt,
    default: () => BigInt(0),
  },
});

CommandConfigSchema.index({ id: 1, guildId: 1, commandPath: 1 }, { unique: true });

export const CommandConfig = models.CommandConfig
  ? model<ICommandConfig>("CommandConfig")
  : model<ICommandConfig>("CommandConfig", CommandConfigSchema, "commandConfigs");
