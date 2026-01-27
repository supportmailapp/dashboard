import { type IDBGuild, type IDBUser, type ITicketConfig, type ReportLimitsConfig } from "$lib/sm-types";
import type { Document, Types, UpdateQuery, UpdateWithAggregationPipeline } from "mongoose";
import { DBGuild, DBUser } from "./models";
import { TicketCategory } from "./models/src/ticketCategory";

type DBGuildProjection = "full" | "generalTicketSettings" | "language" | "reportSettings";

export interface DBGuildProjectionReturns {
  full: IDBGuild;
  generalTicketSettings: Pick<
    ITicketConfig,
    "enabled" | "forumId" | "anonym" | "autoForwarding" | "creationMessage" | "closeMessage"
  > & {
    pausedUntil: APIPausedUntil;
    allowedBots: string[];
  };
  language: string;
  reportSettings: Omit<IDBGuild["reportConfig"], "pausedUntil" | "limits"> & {
    pausedUntil: APIPausedUntil;
    limits: ReportLimitsConfig;
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

  const jsonConfig = FlattenDocToJSON(_config, true);
  const defaultP = {
    value: false,
    date: null,
  };

  switch (projection) {
    case "generalTicketSettings":
      return {
        enabled: jsonConfig.ticketConfig.enabled,
        pausedUntil: jsonConfig.ticketConfig.pausedUntil,
        forumId: jsonConfig.ticketConfig.forumId,
        anonym: jsonConfig.ticketConfig.anonym,
        autoForwarding: jsonConfig.ticketConfig.autoForwarding,
        allowedBots: jsonConfig.ticketConfig.allowedBots,
        creationMessage: jsonConfig.ticketConfig.creationMessage || "",
        closeMessage: jsonConfig.ticketConfig.closeMessage || "",
      } as DBGuildProjectionReturns[T];
    case "language":
      return jsonConfig.lang as DBGuildProjectionReturns[T];
    case "reportSettings":
      return {
        ...jsonConfig.reportConfig,
        pausedUntil: jsonConfig.reportConfig.pausedUntil ?? defaultP,
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

export function getTicketCategories(guildId: string, label?: string) {
  if (label) {
    return TicketCategory.find({ guildId: guildId, label });
  }
  return TicketCategory.find({ guildId: guildId });
}

type ExcludeFields<T, K extends keyof T> = Omit<T, K>;

export type FlattenDocResult<
  T,
  IncludeId extends boolean,
  ExcludedFields extends Exclude<keyof T, "_id" | "__v"> = never,
> = IncludeId extends true
  ? DocumentWithId<ExcludeFields<Omit<T, "__v" | "_id">, ExcludedFields>>
  : ExcludeFields<Omit<T, "__v" | "_id">, ExcludedFields>;

export function FlattenDocToJSON<T, K extends keyof Omit<T, "__v" | "_id"> = never>(
  val: Document<unknown, {}, T, {}> &
    T & {
      _id: Types.ObjectId;
    } & {
      __v?: number;
    },
  with_Id?: false,
  excludeFields?: K[],
): FlattenDocResult<T, false, K>;
export function FlattenDocToJSON<T, K extends keyof Omit<T, "__v" | "_id"> = never>(
  val: Document<unknown, {}, T, {}> &
    T & {
      _id: Types.ObjectId;
    } & {
      __v?: number;
    },
  with_Id: true,
  excludeFields?: K[],
): FlattenDocResult<T, true, K>;

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
export function FlattenDocToJSON<T, K extends keyof Omit<T, "__v" | "_id"> = never>(
  val: Document<unknown, {}, T, {}> &
    T & {
      _id: Types.ObjectId;
    } & {
      __v?: number;
    },
  with_Id: boolean = false,
  excludeFields?: K[],
): FlattenDocResult<T, typeof with_Id, K> {
  excludeFields = excludeFields ?? [];
  return val.toJSON({
    flattenMaps: true,
    flattenObjectIds: true,
    versionKey: false,
    transform: (_, ret) => {
      const { __v, ...cleanRet } = ret;
      for (const field of excludeFields!) {
        delete (cleanRet as any)[field];
      }
      if (!with_Id) {
        const { _id, ...finalRet } = cleanRet;
        return finalRet;
      }
      const { _id, ...finalRet } = cleanRet;
      if (_id === undefined) {
        return finalRet;
      }
      return { ...finalRet, _id: _id.toString() };
    },
  }) as FlattenDocResult<T, typeof with_Id, K>;
}

type FlattenBigIntResult<T> = {
  [K in keyof T]: T[K] extends bigint ? string : T[K];
};

/**
 * Flattens a Mongoose Document even more by turning bigint fields into strings.
 */
export function FlattenBigIntFields<T extends Record<string, any>>(obj: T): FlattenBigIntResult<T> {
  const newObj = { ...obj };
  for (const key in newObj) {
    if (typeof newObj[key] === "bigint") {
      newObj[key] = String(newObj[key]) as any;
    }
  }
  return newObj as FlattenBigIntResult<T>;
}

export function FlattenDateFields<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  ...dateFields: K[]
): Omit<T, K> & {
  [P in K]: string;
} {
  const newObj = { ...obj };
  for (const field of dateFields) {
    const value = newObj[field];
    if ((value as any) instanceof Date) {
      newObj[field] = value.toISOString();
    }
  }
  return newObj;
}
