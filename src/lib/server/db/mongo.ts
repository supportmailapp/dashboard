import mongoose from "mongoose";
import { mongoUri, NODE_ENV } from "$env/static/private";

/**
 * Connection ready state
 *
 * - 0 = disconnected
 * - 1 = connected
 * - 2 = connecting
 * - 3 = disconnecting
 * - 99 = uninitialized
 */
const mongoConnection = {
  isConnected: 0,
};

export async function dbConnect() {
  if (mongoConnection.isConnected === 1) {
    console.log("already connected");
    return;
  }

  if (mongoose.connections.length > 0) {
    mongoConnection.isConnected = mongoose.connections[0].readyState;
    if (mongoConnection.isConnected === 1) {
      console.log("using existing connection");
      return;
    }

    await mongoose.disconnect();
  }
  mongoConnection.isConnected = 2;
  await mongoose.connect(mongoUri);
  mongoConnection.isConnected = 1;
  console.log("Connected to MongoDB");
}

export async function dbDisconnect() {
  if (NODE_ENV === "development") return;
  if (mongoConnection.isConnected === 0) return;

  mongoConnection.isConnected = 3;
  await mongoose.disconnect();
  mongoConnection.isConnected = 0;
  console.log("Disconnected from MongoDB");
}
