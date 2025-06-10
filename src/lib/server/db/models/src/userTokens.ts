import { model, Schema } from "mongoose";
import pkg from "mongoose";
const { models } = pkg;
import type { IUserToken } from "supportmail-types";
import encryptor from "../../encryptor";

const userTokenSchema = new Schema<IUserToken>(
  {
    userId: { type: String, required: true, unique: true },
    accessToken: {
      type: String,
      required: true,
      set: (v: string) => {
        return encryptor.encrypt(v);
      },
      get: (v: string) => {
        return encryptor.decrypt(v);
      },
    },
    refreshToken: {
      type: String,
      required: false,
      set: (v: string) => {
        return encryptor.encrypt(v);
      },
      get: (v: string) => {
        return encryptor.decrypt(v);
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
      virtuals: true,
      transform: (doc, ret) => {
        // Remove the _id and __v fields from the output
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      flattenMaps: true,
      flattenObjectIds: true,
      getters: true,
      virtuals: true,
      transform: (doc, ret) => {
        // Remove the _id and __v fields from the output
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const UserToken = models.UserToken
  ? model<IUserToken>("UserToken")
  : model<IUserToken>("UserToken", userTokenSchema, "userTokens");
