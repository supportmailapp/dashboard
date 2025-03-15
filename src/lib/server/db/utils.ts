import type { IDBGuild, IDBUser } from "supportmail-types";
import type {
  Filter,
  Document,
  OptionalId,
  InsertOneOptions,
  InsertOneResult,
  UpdateFilter,
  UpdateResult,
  UpdateOptions,
  Abortable,
  CountDocumentsOptions,
  FindOneAndDeleteOptions,
  WithId,
  Collection,
} from "mongodb";

import { mongoDB } from "./mongo";

const db = mongoDB.getDB();

export const getCollection = async function <T extends Document>(collectionName: string): Promise<Collection<T>> {
  return db.collection(collectionName);
};

export const getDocument = async function <T extends Document>(
  collectionName: string,
  query: Filter<T> = {},
): Promise<WithId<T> | null> {
  const collection = await getCollection<T>(collectionName);
  return await collection.findOne(query);
};

export const getDocuments = async function <T extends Document>(collectionName: string, filter: Filter<Document> = {}) {
  const collection = await getCollection<T>(collectionName);
  return collection.find(filter).toArray();
};

export const insertDocument = async function <T extends Document>(
  collectionName: string,
  doc: OptionalId<T>,
  options: InsertOneOptions = {},
): Promise<InsertOneResult<T>> {
  const collection = await getCollection(collectionName);
  return await collection.insertOne(doc, options);
};

/**
 * Update a document in the database.
 *
 * @param upsert If true, creates a new document when no document matches the query. Defaults to `false`.
 */
export const updateDocument = async function <T extends Document>(
  collectionName: string,
  filter: Filter<Document>,
  update: UpdateFilter<Document> | T[],
  options: UpdateOptions = {},
  upsert = false,
): Promise<UpdateResult<T>> {
  const collection = await getCollection(collectionName);
  return await collection.updateOne(filter, update, { ...options, upsert: upsert });
};

export const updateDocuments = async function <T extends Document>(
  collectionName: string,
  filter: Filter<Document>,
  update: UpdateFilter<Document> | Document[],
  options: UpdateOptions = {},
): Promise<UpdateResult<T>> {
  const collection = await getCollection(collectionName);
  return await collection.updateMany(filter, update, options);
};

export const deleteDocument = async function (collectionName: string, filter: Filter<Document>) {
  const collection = await getCollection(collectionName);
  return await collection.deleteOne(filter);
};

export const deleteDocuments = async function (collectionName: string, filter: Filter<Document>) {
  const collection = await getCollection(collectionName);
  return collection.deleteMany(filter).then((res) => res);
};

export const countDocuments = async function (
  collectionName: string,
  query: Filter<Document> = {},
  options: CountDocumentsOptions & Abortable,
): Promise<number> {
  const collection = await getCollection(collectionName);
  return collection.countDocuments(query, options);
};

export const findAndDelete = async function (
  collectionName: string,
  query: Filter<Document>,
  options: FindOneAndDeleteOptions = {},
) {
  const collection = await getCollection(collectionName);
  return collection.findOneAndDelete(query, options);
};

// * Specialized functions * //

export function getGuild(guildId: string) {
  return getDocument<IDBGuild>("guilds", { id: guildId });
}

export function updateGuild(guildId: string, update: UpdateFilter<IDBGuild>) {
  return updateDocument<IDBGuild>("guilds", { id: guildId }, { $set: update });
}

export function getUser(userId: string) {
  return getDocument<IDBUser>("users", { id: userId });
}

export function updateUser(userId: string, update: UpdateFilter<IDBUser>) {
  return updateDocument<IDBUser>("users", { id: userId }, { $set: update });
}
