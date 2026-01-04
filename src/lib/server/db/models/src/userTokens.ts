import { DB_ENCRYPTION_KEY } from "$env/static/private";
import type { IUserToken } from "$lib/sm-types";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import pkg, { model, Schema } from "mongoose";
const { models } = pkg;

function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", DB_ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  // Combine IV + authTag + encrypted data and encode as base64
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, "hex")]);

  return combined.toString("base64");
}

function decrypt(encryptedBase64: string): string {
  const combined = Buffer.from(encryptedBase64, "base64");
  const iv = combined.subarray(0, 16);
  const authTag = combined.subarray(16, 32);
  const encrypted = combined.subarray(32);

  const decipher = createDecipheriv("aes-256-gcm", DB_ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
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
