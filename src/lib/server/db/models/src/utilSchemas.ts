/**
 * @description This file defines schemas for utility types used in database models.
 * These schemas are not bound to any specific guild, which is why no models are created here.
 */

import { Schema } from "mongoose";
import type { IPartialEmoji, Entity, ICustomModalField } from "supportmail-types";

const partialEmojiSchema = new Schema<IPartialEmoji>(
  {
    id: { type: String, required: false },
    name: { type: String, required: true },
    animated: { type: Boolean, required: false },
  },
  { _id: false },
);

const entitySchema = new Schema<Entity>(
  {
    typ: { type: Number, required: true },
    id: { type: String, required: true },
  },
  {
    _id: false,
  },
);

const customModalFieldSchema = new Schema<ICustomModalField>(
  {
    position: { type: Number, default: 1 },
    label: { type: String, required: true },
    placeholder: { type: String, required: false },
    style: { type: Number, default: 1 },
    minL: { type: Number, default: 0 },
    maxL: { type: Number, default: 256 },
    _required: { type: Boolean, default: true },
  },
  {
    _id: false,
  },
);

export { partialEmojiSchema, entitySchema, customModalFieldSchema };
