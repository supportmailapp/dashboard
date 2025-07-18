import { Document, Types, type UpdateQuery, type UpdateWithAggregationPipeline } from "mongoose";
import {
  V2ComponentsValidator,
  type IDBGuild,
  type IDBUser,
  type ITicketConfig,
  type PausedUntil,
} from "supportmail-types";
import { ValidationError } from "zod-validation-error";
import { DBGuild, DBUser } from "./models";
import { TicketCategory } from "./models/src/ticketCategory";

type DBGuildProjection = "full" | "generalTicketSettings" | "language" | "pausing";

export interface DBGuildProjectionReturns {
  full: IDBGuild;
  generalTicketSettings: Pick<
    ITicketConfig,
    "enabled" | "forumId" | "anonym" | "autoForwarding" | "allowedBots"
  > & {
    pausedUntil: APIPausedUntil;
  };
  language: string;
  pausing: {
    tickets: PausedUntil;
    reports: PausedUntil;
  };
}

// Typed functions
export async function getDBGuild<T extends DBGuildProjection>(
  guildId: string,
  projection: T,
): Promise<DBGuildProjectionReturns[T] | null> {
  const _config = await DBGuild.findOne({ id: guildId });
  if (!_config || !projection || projection === "full") {
    return (_config ? FlattenDocToJSON(_config) : null) as DBGuildProjectionReturns[T] | null;
  }

  const jsonConfig = FlattenDocToJSON(_config);

  switch (projection) {
    case "generalTicketSettings":
      return {
        enabled: jsonConfig.ticketConfig.enabled,
        pausedUntil: jsonConfig.ticketConfig.pausedUntil,
        forumId: jsonConfig.ticketConfig.forumId,
        anonym: jsonConfig.ticketConfig.anonym,
        autoForwarding: jsonConfig.ticketConfig.autoForwarding,
        allowedBots: jsonConfig.ticketConfig.allowedBots,
      } as DBGuildProjectionReturns[T];
    case "language":
      return jsonConfig.lang as DBGuildProjectionReturns[T];
    case "pausing":
      const defaultP = {
        value: false,
        date: null,
      };
      return {
        tickets: jsonConfig.ticketConfig.pausedUntil ?? defaultP,
        reports: jsonConfig.reportConfig.pausedUntil ?? defaultP,
      } as DBGuildProjectionReturns[T];
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
  return TicketCategory.find({ guildId: guildId });
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

type FlattenDocResult<T, IncludeId extends boolean> = IncludeId extends true
  ? Omit<T, "__v" | "_id"> & { _id: string }
  : Omit<T, "__v" | "_id">;

export function FlattenDocToJSON<T>(
  val: Document<unknown, {}, T, {}> &
    T & {
      _id: Types.ObjectId;
    } & {
      __v?: number;
    },
  with_Id?: false,
): FlattenDocResult<T, false>;
export function FlattenDocToJSON<T>(
  val: Document<unknown, {}, T, {}> &
    T & {
      _id: Types.ObjectId;
    } & {
      __v?: number;
    },
  with_Id: true,
): FlattenDocResult<T, true>;

/**
 * Converts a Mongoose Document or FlattenMaps object to a plain JSON object.
 *
 * @template T - The type of the document/object being converted
 * @param val - The Mongoose Document or FlattenMaps object to convert
 * @param with_Id - Whether to include the MongoDB `_id` field in the result. Defaults to false
 * @returns A plain JSON object of type T with optional `_id` field based on the `with_Id` parameter
 *
 * @example
 * ```typescript
 * const user = await User.findById(id);
 * const userJson = DocumentToJSON(user); // Without _id
 * const userJsonWithId = DocumentToJSON(user, true); // With _id
 * ```
 *
 * @remarks
 * This is an extended implementation of `Document.toJSON()` - one can pass basically anything and
 * option handling is easier.
 */
export function FlattenDocToJSON<T>(
  val: Document<unknown, {}, T, {}> &
    T & {
      _id: Types.ObjectId;
    } & {
      __v?: number;
    },
  with_Id: boolean = false,
): FlattenDocResult<T, typeof with_Id> {
  return val.toJSON({
    flattenMaps: true,
    flattenObjectIds: true,
    versionKey: false,
    transform: (_, ret) => {
      delete ret.__v;
      if (!with_Id) {
        delete ret._id;
      }
      return ret;
    },
  }) as FlattenDocResult<T, typeof with_Id>;
}
