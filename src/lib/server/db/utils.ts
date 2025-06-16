import { V2ComponentsValidator, type IDBGuild, type IDBUser, type ITicketConfig } from "supportmail-types";
import type { UpdateQuery, UpdateWithAggregationPipeline } from "mongoose";
import { ValidationError } from "zod-validation-error";
import { DBGuild, DBUser } from "./models";
import { TicketCategory } from "./models/src/ticketCategory";
import { LANGUAGES } from "$lib/constants";

type DBGuildProjection = "full" | "generalTicketSettings" | "language";

export interface DBGuildProjectionReturns {
  full: IDBGuild;
  generalTicketSettings: Pick<
    ITicketConfig,
    "enabled" | "pausedUntil" | "forumId" | "anonym" | "autoForwarding" | "allowedBots"
  >;
  language: string;
}

// Typed functions
export async function getDBGuild<T extends DBGuildProjection>(
  guildId: string,
  projection: T,
): Promise<DBGuildProjectionReturns[T] | null> {
  const _config = await DBGuild.findOne({ id: guildId }, null, { lean: true });
  if (!_config || !projection || projection === "full") {
    return _config as DBGuildProjectionReturns[T] | null;
  }

  switch (projection) {
    case "generalTicketSettings":
      return {
        enabled: _config.ticketConfig.enabled,
        pausedUntil: _config.ticketConfig.pausedUntil,
        forumId: _config.ticketConfig.forumId,
        anonym: _config.ticketConfig.anonym,
        autoForwarding: _config.ticketConfig.autoForwarding,
        allowedBots: _config.ticketConfig.allowedBots,
      } as DBGuildProjectionReturns[T];
    case "language":
      return _config.lang as DBGuildProjectionReturns[T];
    default:
      throw new Error(`Unsupported projection: ${projection}`);
  }
}

/**
 * Updates a guild document in the database by guild ID.
 *
 * @param guildId - The unique identifier of the guild to update
 * @param update - The update query or aggregation pipeline to apply to the guild document
 * @returns A promise that resolves to the updated guild document, or null if no guild was found
 */
export function updateDBGuild(
  guildId: string,
  update: UpdateQuery<IDBGuild> | UpdateWithAggregationPipeline,
) {
  return DBGuild.findOneAndUpdate({ id: guildId }, update, { new: true });
}

export function getDBUser(userId: string) {
  return DBUser.findOne({ id: userId }, null, { lean: true });
}

export async function updateDBUser(
  userId: string,
  update: UpdateQuery<IDBUser> | UpdateWithAggregationPipeline,
  upsert = false,
) {
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
