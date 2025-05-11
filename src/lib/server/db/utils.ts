import { V2ComponentsValidator, type IDBGuild, type IDBUser } from "supportmail-types";
import type { UpdateQuery, UpdateWithAggregationPipeline } from "mongoose";
import { ValidationError } from "zod-validation-error";
import { DBGuild, DBUser } from "./models";
import { TicketCategory } from "./models/src/ticketCategory";
import { LANGUAGES } from "$lib/constants";

export function getGuild(guildId: string) {
  return DBGuild.findOne({ id: guildId }, null, { lean: true });
}

export function updateGuild(guildId: string, update: UpdateQuery<IDBGuild> | UpdateWithAggregationPipeline) {
  return DBGuild.updateOne({ id: guildId }, update);
}

export function getUser(userId: string) {
  return DBUser.findOne({ id: userId }, null, { lean: true });
}

export async function updateUser(userId: string, update: UpdateQuery<IDBUser> | UpdateWithAggregationPipeline, upsert = false) {
  if (upsert) {
    const userExists = await DBUser.exists({ id: userId });
    if (!userExists) {
      await DBUser.create({ id: userId });
    }
  }

  return await DBUser.updateOne({ id: userId }, update);
}

export function getTicketCategories(guildId: string) {
  return TicketCategory.find({ guildId: guildId }, null, { lean: true });
}

export async function verifyComponentsV2Payload(components: any[]) {
  try {
    const res = new V2ComponentsValidator(components).toJSON();
    return {
      valid: true,
      components: res,
    };
  } catch (err: any) {
    if (err instanceof ValidationError) {
      return {
        valid: false,
        error: {
          message: err.message,
          details: err,
        },
      };
    }
    throw err;
  }
}

/**
 * Verifies if the provided language is supported.
 */
export const verifyLanguage = (language: string) => {
  return LANGUAGES.some((lang) => lang.value === language);
};
