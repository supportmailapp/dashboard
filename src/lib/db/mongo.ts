import { mongoUri } from "$env/static/private";
import { MongoClient } from "mongodb";

const client = new MongoClient(mongoUri);

// connect to the database
export const connect = client.connect;

// disconnect from the database
export const disconnect = client.close;

// get the database
export function getDB(): any {
  return client.db();
}