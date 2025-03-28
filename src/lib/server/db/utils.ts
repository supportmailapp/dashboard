import type { IDBGuild, IDBUser } from "supportmail-types";
import { DBGuild, DBUser } from "./models";
import type { UpdateQuery, UpdateWithAggregationPipeline } from "mongoose";

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
