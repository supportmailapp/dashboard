/**
 * @description This file defines schemas for utility types used in database models.
 * These schemas are not bound to any specific guild, which is why no models are created here.
 */

import type {
  AnyEntity,
  ICustomModalField,
  IFormComponent,
  IPartialEmoji,
  IStringSelectOption,
} from "$lib/sm-types";
import { Schema } from "mongoose";

export const partialEmojiSchema = new Schema<IPartialEmoji>(
  {
    id: { type: String, required: false },
    name: { type: String, required: true },
    animated: { type: Boolean, required: false },
  },
  { _id: false },
);

export const EntitySchema = new Schema<AnyEntity>(
  {
    typ: { type: Number, required: true },
    id: { type: String, required: true },
  },
  {
    _id: false,
    versionKey: false,
  },
);

export const customModalFieldSchema = new Schema<ICustomModalField>({
  position: { type: Number, default: 1 },
  label: { type: String, required: true },
  placeholder: { type: String, required: false },
  style: { type: Number, default: 1 },
  minL: { type: Number, default: 0 },
  maxL: { type: Number, default: 256 },
  _required: { type: Boolean, default: true },
});

export const formStringSelectOptionSchema = new Schema<IStringSelectOption>({
  label: { type: String, required: true, maxlength: 45 },
  value: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: false, maxlength: 100 },
  emoji: { type: String, required: false, maxlength: 100 },
  default: { type: Boolean, required: false, default: false },
});

export const FormComponentSchema = new Schema<IFormComponent>({
  type: { type: Number, required: true },
  id: { type: String, required: true, minlength: 17, maxlength: 23 },
  required: { type: Boolean, default: false },
  content: { type: String, required: false },
  placeholder: { type: String, required: false },
  style: { type: Number, required: false },
  label: { type: String, required: false, minlength: 1, maxlength: 45 },
  description: { type: String, required: false, maxlength: 100 },
  minLength: { type: Number, required: false, min: 0, max: 4000 },
  maxLength: { type: Number, required: false, min: 1, max: 4000 },
  defaultValue: { type: String, required: false, minlength: 0, maxlength: 4000 },
  minValues: { type: Number, required: false, min: 0, max: 25 },
  maxValues: { type: Number, required: false, min: 1, max: 25 },
  messageLabel: { type: String, required: false, maxlength: 100 },
  options: { type: [formStringSelectOptionSchema], required: false },
});
