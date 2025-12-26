import { DB_ENCRYPTION_IV, DB_ENCRYPTION_KEY } from "$env/static/private";
import type { IUserToken } from "$lib/sm-types";
import { createCipheriv, createDecipheriv } from "crypto";
import pkg, { model, Schema } from "mongoose";
const { models } = pkg;

const algorithm = "aes-256-cbc";
const encKey = Buffer.from(DB_ENCRYPTION_KEY, "utf-8");
const encIV = Buffer.from(DB_ENCRYPTION_IV, "utf-8");

export function encrypt(text: string): string {
  try {
    const cipher = createCipheriv(algorithm, encKey, encIV);
    let encrypted = cipher.update(text, "utf-8", "hex");
    encrypted += cipher.final("hex");
    console.log("Encrypted:", encrypted);
    return encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt token");
  }
}

export function decrypt(encryptedText: string): string {
  try {
    const decipher = createDecipheriv(algorithm, encKey, encIV);
    let decrypted = decipher.update(encryptedText, "hex", "utf-8");
    decrypted += decipher.final("utf-8");
    console.log("Decrypted:", decrypted);
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt token");
  }
}

const userTokenSchema = new Schema<IUserToken>(
  {
    userId: { type: String, required: true, unique: true },
    accessToken: {
      type: String,
      required: true,
      set: (v: string) => {
        if (!v) return v;
        return encrypt(v);
      },
      get: (v: string) => {
        if (!v) return v;
        return decrypt(v);
      },
    },
    refreshToken: {
      type: String,
      default: null,
      set: (v: string | null) => {
        if (!v) return null;
        return encrypt(v);
      },
      get: (v: string | null) => {
        if (!v) return null;
        return decrypt(v);
      },
    },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      flattenMaps: true,
      flattenObjectIds: true,
      getters: true,
    },
    toObject: {
      flattenMaps: true,
      flattenObjectIds: true,
      getters: true,
    },
  },
);

export const UserToken = models.UserToken
  ? model<IUserToken>("UserToken")
  : model<IUserToken>("UserToken", userTokenSchema, "userTokens");
